import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import StarRating from "@/components/StarRating";
import TagInput from "@/components/TagInput";
import { toast } from "sonner";
import { FOCUS_AREAS, FOCUS_AREA_COLORS, formatDate, formatDuration } from "@/lib/constants";
import { ArrowRight, Drum, Edit2, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type PracticeSession = {
  id: string;
  date: string;
  duration_minutes: number;
  focus_area: string;
  exercise_name: string | null;
  bpm_start: number | null;
  bpm_end: number | null;
  feel_rating: number | null;
  notes: string | null;
  tags: string[] | null;
  audio_url: string | null;
  user_id: string;
};

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [search, setSearch] = useState("");
  const [editSession, setEditSession] = useState<PracticeSession | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const fetchSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("practice_sessions")
      .select("*")
      .order("date", { ascending: false });
    setSessions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const filtered = sessions.filter((s) => {
    if (filterArea !== "All" && s.focus_area !== filterArea) return false;
    if (filterMonth) {
      const sessionMonth = s.date.slice(0, 7);
      if (sessionMonth !== filterMonth) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = s.exercise_name?.toLowerCase().includes(q);
      const matchTag = s.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("practice_sessions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Session deleted");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading">My Sessions</h1>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Focus Areas</SelectItem>
            {FOCUS_AREAS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="sm:w-48" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercise or tag..." className="flex-1" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Drum className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-3">
            {sessions.length === 0 ? "No sessions yet!" : "No sessions match your filters."}
          </p>
          {sessions.length === 0 && (
            <Link to="/log" className="text-primary font-medium hover:underline">
              Log your first session →
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              expanded={expandedNotes.has(s.id)}
              onToggleNotes={() => toggleNotes(s.id)}
              onEdit={() => setEditSession(s)}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}

      {editSession && (
        <EditModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onSaved={() => {
            setEditSession(null);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}

function SessionCard({
  session: s,
  expanded,
  onToggleNotes,
  onEdit,
  onDelete,
}: {
  session: PracticeSession;
  expanded: boolean;
  onToggleNotes: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasBpm = s.bpm_start != null && s.bpm_end != null;
  const bpmGain = hasBpm ? s.bpm_end! - s.bpm_start! : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{formatDate(s.date)}</p>
            <p className="font-semibold text-lg leading-tight">{s.exercise_name || s.focus_area}</p>
          </div>
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", FOCUS_AREA_COLORS[s.focus_area] || "")}>
            {s.focus_area}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{formatDuration(s.duration_minutes)}</span>
          {hasBpm && (
            <span className={cn("flex items-center gap-1", bpmGain > 0 ? "text-success" : "text-muted-foreground")}>
              {s.bpm_start} <ArrowRight className="w-3 h-3" /> {s.bpm_end} BPM
            </span>
          )}
        </div>

        {s.feel_rating && <StarRating value={s.feel_rating} readonly size="sm" />}

        {s.tags && s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                {t}
              </span>
            ))}
          </div>
        )}

        {s.notes && (
          <div>
            <p className={cn("text-sm whitespace-pre-wrap", !expanded && "line-clamp-2")}>{s.notes}</p>
            {s.notes.length > 100 && (
              <button onClick={onToggleNotes} className="text-xs text-primary flex items-center gap-0.5 mt-1">
                {expanded ? "Show less" : "Read more"}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {s.audio_url && (
          <audio controls src={s.audio_url} className="w-full h-8">
            <track kind="captions" />
          </audio>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function EditModal({
  session,
  onClose,
  onSaved,
}: {
  session: PracticeSession;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(session.date);
  const [duration, setDuration] = useState(String(session.duration_minutes));
  const [focusArea, setFocusArea] = useState(session.focus_area);
  const [exerciseName, setExerciseName] = useState(session.exercise_name || "");
  const [bpmStart, setBpmStart] = useState(session.bpm_start ? String(session.bpm_start) : "");
  const [bpmEnd, setBpmEnd] = useState(session.bpm_end ? String(session.bpm_end) : "");
  const [feelRating, setFeelRating] = useState(session.feel_rating || 0);
  const [tags, setTags] = useState<string[]>(session.tags || []);
  const [notes, setNotes] = useState(session.notes || "");
  const [audioUrl, setAudioUrl] = useState(session.audio_url || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("practice_sessions")
      .update({
        date,
        duration_minutes: parseInt(duration),
        focus_area: focusArea,
        exercise_name: exerciseName || null,
        bpm_start: bpmStart ? parseInt(bpmStart) : null,
        bpm_end: bpmEnd ? parseInt(bpmEnd) : null,
        feel_rating: feelRating || null,
        tags: tags.length > 0 ? tags : null,
        notes: notes || null,
        audio_url: audioUrl || null,
      })
      .eq("id", session.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success("Session updated!");
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Focus Area</Label>
            <Select value={focusArea} onValueChange={setFocusArea}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOCUS_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Exercise Name</Label>
            <Input value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starting BPM</Label>
              <Input type="number" value={bpmStart} onChange={(e) => setBpmStart(e.target.value)} />
            </div>
            <div>
              <Label>Ending BPM</Label>
              <Input type="number" value={bpmEnd} onChange={(e) => setBpmEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Feel Rating</Label>
            <StarRating value={feelRating} onChange={setFeelRating} />
          </div>
          <div>
            <Label>Tags</Label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Audio URL</Label>
            <Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
