import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, CheckCircle2, Clock, Target, Zap, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

export default function Calendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const { data: scheduled = [], isLoading } = useQuery({
    queryKey: ["scheduled_practices", user?.id, format(monthStart, "yyyy-MM"), format(monthEnd, "yyyy-MM")],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_practices")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", format(calendarStart, "yyyy-MM-dd"))
        .lte("date", format(calendarEnd, "yyyy-MM-dd"))
        .order("date");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_practices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_practices"] });
      toast.success("Practice removed from calendar");
    },
  });

  const dayEvents = useMemo(() => {
    const map: Record<string, typeof scheduled> = {};
    for (const s of scheduled) {
      const key = s.date;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [scheduled]);

  const selectedEvents = selectedDate
    ? dayEvents[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const handleLogSession = (event: (typeof scheduled)[0]) => {
    const params = new URLSearchParams();
    params.set("focus", event.focus_area);
    params.set("duration", String(event.duration_minutes));
    params.set("exercise", event.activity);
    if (event.bpm_range) {
      const match = event.bpm_range.match(/(\d+)/);
      if (match) params.set("bpm", match[1]);
    }
    params.set("scheduled_id", event.id);
    params.set("date", event.date);
    navigate(`/log?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Practice Calendar</h1>
        <p className="text-muted-foreground mt-1">Your scheduled practice sessions — click a day to see details, then log your session</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-lg">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const events = dayEvents[key] || [];
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const hasEvents = events.length > 0;
              const allCompleted = hasEvents && events.every((e) => e.completed);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isToday && "bg-accent/20 font-bold",
                    !isSelected && hasEvents && !allCompleted && "bg-primary/10",
                    !isSelected && allCompleted && "bg-green-500/10",
                    !isSelected && "hover:bg-muted"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected ? "bg-primary-foreground" : allCompleted ? "bg-green-500" : "bg-primary"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDate && (
        <div className="space-y-3">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h2>
          {selectedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No practice scheduled for this day.
              </CardContent>
            </Card>
          ) : (
            selectedEvents.map((event) => (
              <Card key={event.id} className={cn(event.completed && "opacity-70")}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{event.activity}</p>
                        {event.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Logged
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> {event.focus_area}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {event.duration_minutes} min
                        </span>
                        {event.bpm_range && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" /> {event.bpm_range} BPM
                          </span>
                        )}
                      </div>
                      {event.tips && (
                        <p className="text-xs text-muted-foreground italic">💡 {event.tips}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!event.completed && (
                        <Button size="sm" onClick={() => handleLogSession(event)}>
                          <Play className="w-4 h-4 mr-1" /> Log
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
