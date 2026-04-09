import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import TagInput from "@/components/TagInput";
import { toast } from "sonner";
import { FOCUS_AREAS } from "@/lib/constants";
import { Play } from "lucide-react";

export default function LogSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [bpmStart, setBpmStart] = useState("");
  const [bpmEnd, setBpmEnd] = useState("");
  const [feelRating, setFeelRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("practice_sessions").insert({
      user_id: user.id,
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
    });

    setLoading(false);
    if (error) {
      toast.error("Failed to save session");
    } else {
      toast.success("Session logged!");
      navigate("/sessions");
    }
  };

  const isValidAudio = audioUrl && /\.(mp3|wav|ogg|m4a|webm)(\?|$)/i.test(audioUrl);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading mb-6">Log Session</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New Practice Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <Label>Duration (minutes) *</Label>
                <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required placeholder="45" />
              </div>
            </div>

            <div>
              <Label>Focus Area *</Label>
              <Select value={focusArea} onValueChange={setFocusArea} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select focus area" />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Exercise Name</Label>
              <Input value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} placeholder="Single Stroke Roll, Purdie Shuffle..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Starting BPM</Label>
                <Input type="number" min={1} value={bpmStart} onChange={(e) => setBpmStart(e.target.value)} placeholder="80" />
              </div>
              <div>
                <Label>Ending BPM</Label>
                <Input type="number" min={1} value={bpmEnd} onChange={(e) => setBpmEnd(e.target.value)} placeholder="112" />
              </div>
            </div>

            <div>
              <Label>Feel Rating</Label>
              <div className="mt-1">
                <StarRating value={feelRating} onChange={setFeelRating} />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reflections, what clicked, what to fix..." rows={4} />
            </div>

            <div>
              <Label>Audio URL</Label>
              <div className="flex gap-2 items-center">
                <Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://example.com/recording.mp3" className="flex-1" />
                {isValidAudio && (
                  <audio controls src={audioUrl} className="h-8 w-32">
                    <track kind="captions" />
                  </audio>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !focusArea || !duration || !date}>
              {loading ? "Saving..." : "Log Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
