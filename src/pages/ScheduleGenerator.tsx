import { useState } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Clock, Target, Music, Zap, Calendar, CheckCircle2, Download, CalendarPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addDays, nextMonday, format } from "date-fns";

interface Answers {
  skillLevel: string;
  experience: string;
  practiceTime: string;
  daysPerWeek: string;
  genres: string;
  goals: string;
  weaknesses: string;
  equipment: string;
  currentExercises: string;
}

interface ScheduleBlock {
  duration: string;
  activity: string;
  focus: string;
  bpmRange?: string;
  tips?: string;
}

interface ScheduleDay {
  day: string;
  blocks: ScheduleBlock[];
}

interface Schedule {
  summary: string;
  weeklyHours: number;
  days: ScheduleDay[];
  monthlyGoals: string[];
  tips: string[];
}

const STEPS = [
  { title: "Skill Level", icon: Target, description: "Tell us about your drumming experience" },
  { title: "Availability", icon: Clock, description: "How much time can you dedicate?" },
  { title: "Preferences", icon: Music, description: "What do you want to focus on?" },
  { title: "Details", icon: Zap, description: "Any additional context" },
];

const GENRES = ["Rock", "Jazz", "Metal", "Funk", "Pop", "Latin", "Blues", "Gospel", "Hip-Hop", "Progressive"];
const WEAKNESSES = ["Speed", "Timing", "Independence", "Dynamics", "Fills", "Odd Time Signatures", "Double Bass", "Ghost Notes", "Musicality", "Reading"];

const DAY_MAP: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
};

function parseDurationMinutes(dur: string): number {
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

export default function ScheduleGenerator() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    skillLevel: "", experience: "", practiceTime: "", daysPerWeek: "",
    genres: "", goals: "", weaknesses: "", equipment: "", currentExercises: "",
  });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedWeaknesses, setSelectedWeaknesses] = useState<string[]>([]);

  const toggleChip = (item: string, list: string[], setList: (v: string[]) => void, field: keyof Answers) => {
    const next = list.includes(item) ? list.filter((g) => g !== item) : [...list, item];
    setList(next);
    setAnswers((a) => ({ ...a, [field]: next.join(", ") }));
  };

  const update = (field: keyof Answers, value: string) => setAnswers((a) => ({ ...a, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return answers.skillLevel && answers.experience;
    if (step === 1) return answers.practiceTime && answers.daysPerWeek;
    if (step === 2) return selectedGenres.length > 0 && answers.goals;
    return true;
  };

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-schedule", { body: { answers } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSchedule(data.schedule);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  };

  if (schedule) {
    return <ScheduleView schedule={schedule} onReset={() => { setSchedule(null); setStep(0); }} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Practice Schedule Generator</h1>
        <p className="text-muted-foreground mt-1">Answer a few questions and AI will create your personalized practice plan</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1", i < step ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
            {STEPS[step].title}
          </CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Skill Level</Label>
                <Select value={answers.skillLevel} onValueChange={(v) => update("skillLevel", v)}>
                  <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete Beginner">Complete Beginner</SelectItem>
                    <SelectItem value="Beginner">{"Beginner (< 1 year)"}</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="Advanced">Advanced (3-7 years)</SelectItem>
                    <SelectItem value="Professional">Professional (7+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input type="number" min="0" max="50" placeholder="e.g. 2" value={answers.experience} onChange={(e) => update("experience", e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Daily Practice Time (minutes)</Label>
                <Select value={answers.practiceTime} onValueChange={(v) => update("practiceTime", v)}>
                  <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Practice Days Per Week</Label>
                <Select value={answers.daysPerWeek} onValueChange={(v) => update("daysPerWeek", v)}>
                  <SelectTrigger><SelectValue placeholder="Select days" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} {d === 1 ? "day" : "days"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Musical Genres (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <Badge key={g} variant={selectedGenres.includes(g) ? "default" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleChip(g, selectedGenres, setSelectedGenres, "genres")}>{g}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Goals</Label>
                <Textarea placeholder="e.g. Play along to songs, join a band, improve speed to 200 BPM..." value={answers.goals} onChange={(e) => update("goals", e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Areas to Improve (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {WEAKNESSES.map((w) => (
                    <Badge key={w} variant={selectedWeaknesses.includes(w) ? "default" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleChip(w, selectedWeaknesses, setSelectedWeaknesses, "weaknesses")}>{w}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Equipment Available</Label>
                <Input placeholder="e.g. Full acoustic kit, practice pad, electronic kit" value={answers.equipment} onChange={(e) => update("equipment", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Current Exercises (optional)</Label>
                <Textarea placeholder="What exercises or routines do you currently practice?" value={answers.currentExercises} onChange={(e) => update("currentExercises", e.target.value)} />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Schedule
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleView({ schedule, onReset }: { schedule: Schedule; onReset: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savingToCalendar, setSavingToCalendar] = useState(false);

  const saveToCalendar = async () => {
    if (!user) return;
    setSavingToCalendar(true);
    try {
      const monday = nextMonday(new Date());
      const scheduleName = `AI Plan — ${format(monday, "MMM d, yyyy")}`;

      const rows: any[] = [];
      for (const day of schedule.days) {
        const dayOffset = DAY_MAP[day.day] ?? 0;
        const date = addDays(monday, dayOffset);
        for (const block of day.blocks) {
          rows.push({
            user_id: user.id,
            schedule_name: scheduleName,
            date: format(date, "yyyy-MM-dd"),
            day_of_week: day.day,
            activity: block.activity,
            focus_area: block.focus,
            duration_minutes: parseDurationMinutes(block.duration),
            bpm_range: block.bpmRange || null,
            tips: block.tips || null,
          });
        }
      }

      const { error } = await supabase.from("scheduled_practices").insert(rows);
      if (error) throw error;
      toast.success("Schedule saved to calendar!");
      navigate("/calendar");
    } catch (e: any) {
      toast.error(e.message || "Failed to save schedule");
    } finally {
      setSavingToCalendar(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = margin;

    const accent = [224, 92, 58] as [number, number, number];
    const dark = [26, 26, 46] as [number, number, number];
    const mid = [100, 100, 120] as [number, number, number];
    const lightBg = [248, 248, 250] as [number, number, number];

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const wrappedText = (text: string, x: number, maxW: number, lineH: number): number => {
      const lines = doc.splitTextToSize(text, maxW);
      lines.forEach((line: string) => {
        ensureSpace(lineH);
        doc.text(line, x, y);
        y += lineH;
      });
      return y;
    };

    // Header
    doc.setFillColor(...accent);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("DrumLog Practice Schedule", margin, 17);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`~${schedule.weeklyHours} hours/week`, pageW - margin, 17, { align: "right" });
    y = 36;

    // Summary
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    wrappedText(schedule.summary, margin, contentW, 5);
    y += 4;

    // Days
    for (const day of schedule.days) {
      ensureSpace(14);

      // Day heading
      doc.setFillColor(...accent);
      doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(day.day, margin + 4, y + 5.5);
      y += 11;

      for (const block of day.blocks) {
        const activityLines = doc.splitTextToSize(block.activity, contentW - 28);
        const tipLines = block.tips ? doc.splitTextToSize(`Tip: ${block.tips}`, contentW - 28) : [];
        const blockH = 4 + activityLines.length * 4.5 + 4 + (tipLines.length > 0 ? tipLines.length * 3.5 + 2 : 0) + 3;

        ensureSpace(blockH + 2);

        doc.setFillColor(...lightBg);
        doc.roundedRect(margin, y, contentW, blockH, 1.5, 1.5, "F");

        // Duration badge
        doc.setFillColor(...accent);
        doc.roundedRect(margin + 3, y + 3, 22, 5.5, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(block.duration, margin + 14, y + 7, { align: "center" });

        // Activity
        doc.setTextColor(...dark);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        let textY = y + 5;
        activityLines.forEach((line: string) => {
          doc.text(line, margin + 28, textY);
          textY += 4.5;
        });

        // Meta: focus + BPM
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...mid);
        const meta = block.bpmRange ? `${block.focus} · ${block.bpmRange} BPM` : block.focus;
        doc.text(meta, margin + 28, textY);
        textY += 4;

        // Tips
        if (tipLines.length > 0) {
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "italic");
          tipLines.forEach((line: string) => {
            doc.text(line, margin + 28, textY);
            textY += 3.5;
          });
        }

        y += blockH + 2;
      }
      y += 4;
    }

    // Monthly Goals
    if (schedule.monthlyGoals?.length > 0) {
      ensureSpace(14);
      doc.setFillColor(...accent);
      doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Monthly Goals", margin + 4, y + 5.5);
      y += 12;

      doc.setTextColor(...dark);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      for (const goal of schedule.monthlyGoals) {
        ensureSpace(6);
        doc.setFillColor(...accent);
        doc.circle(margin + 3, y - 0.5, 1, "F");
        wrappedText(goal, margin + 8, contentW - 8, 4.5);
      }
      y += 4;
    }

    // Pro Tips
    if (schedule.tips?.length > 0) {
      ensureSpace(14);
      doc.setFillColor(...accent);
      doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Pro Tips", margin + 4, y + 5.5);
      y += 12;

      doc.setTextColor(...dark);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      for (const tip of schedule.tips) {
        ensureSpace(6);
        doc.setFillColor(...accent);
        doc.circle(margin + 3, y - 0.5, 1, "F");
        wrappedText(tip, margin + 8, contentW - 8, 4.5);
      }
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mid);
      doc.text(`Generated by DrumLog · Page ${p} of ${totalPages}`, pageW / 2, pageH - 6, { align: "center" });
    }

    doc.save("drumlog-schedule.pdf");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" /> Your Practice Plan
          </h1>
          <p className="text-muted-foreground mt-1">{schedule.summary}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button onClick={saveToCalendar} disabled={savingToCalendar}>
            {savingToCalendar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
            Save to Calendar
          </Button>
          <Button variant="outline" onClick={onReset}>Generate New</Button>
        </div>
      </div>

      {schedule.weeklyHours && (
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Clock className="w-3.5 h-3.5 mr-1.5" /> ~{schedule.weeklyHours} hours/week
        </Badge>
      )}

      <div className="grid gap-4">
        {schedule.days?.map((day) => (
          <Card key={day.day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{day.day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {day.blocks?.map((block, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="min-w-[70px]">
                      <Badge variant="outline" className="text-xs">{block.duration}</Badge>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{block.activity}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" />{block.focus}</span>
                        {block.bpmRange && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{block.bpmRange} BPM</span>}
                      </div>
                      {block.tips && <p className="text-xs text-muted-foreground italic">💡 {block.tips}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedule.monthlyGoals?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Monthly Goals</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {schedule.monthlyGoals.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{g}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {schedule.tips?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Pro Tips</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {schedule.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />{t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
