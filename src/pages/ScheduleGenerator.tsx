import { useState } from "react";
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
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to export PDF");
      return;
    }

    const html = `<!DOCTYPE html>
<html><head><title>DrumLog Practice Schedule</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 40px; color: #1a1a2e; }
  h1 { color: #e05c3a; margin-bottom: 4px; }
  h2 { color: #e05c3a; margin-top: 28px; border-bottom: 2px solid #e05c3a; padding-bottom: 4px; }
  .summary { color: #555; margin-bottom: 20px; }
  .day-card { margin-bottom: 18px; break-inside: avoid; }
  .block { background: #f8f8f8; padding: 10px 14px; border-radius: 6px; margin: 6px 0; display: flex; gap: 16px; }
  .block-dur { min-width: 70px; font-weight: 600; color: #e05c3a; }
  .block-info { flex: 1; }
  .block-meta { font-size: 13px; color: #777; margin-top: 2px; }
  .tip { font-style: italic; font-size: 12px; color: #888; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>🥁 DrumLog Practice Schedule</h1>
<p class="summary">${schedule.summary}</p>
<p><strong>~${schedule.weeklyHours} hours/week</strong></p>
${schedule.days.map((day) => `
<div class="day-card">
  <h2>${day.day}</h2>
  ${day.blocks.map((b) => `
  <div class="block">
    <div class="block-dur">${b.duration}</div>
    <div class="block-info">
      <strong>${b.activity}</strong>
      <div class="block-meta">${b.focus}${b.bpmRange ? ` · ${b.bpmRange} BPM` : ""}</div>
      ${b.tips ? `<div class="tip">💡 ${b.tips}</div>` : ""}
    </div>
  </div>`).join("")}
</div>`).join("")}
${schedule.monthlyGoals?.length ? `<h2>Monthly Goals</h2><ul>${schedule.monthlyGoals.map((g) => `<li>${g}</li>`).join("")}</ul>` : ""}
${schedule.tips?.length ? `<h2>Pro Tips</h2><ul>${schedule.tips.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
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
