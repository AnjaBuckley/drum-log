import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, Calendar, TrendingUp, Loader2 } from "lucide-react";
import StarRating from "@/components/StarRating";
import { formatDate, formatDuration, formatDateShort } from "@/lib/constants";

interface Session {
  id: string;
  date: string;
  duration_minutes: number;
  focus_area: string;
  exercise_name: string | null;
  feel_rating: number | null;
  bpm_start: number | null;
  bpm_end: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from("practice_sessions")
        .select("id, date, duration_minutes, focus_area, exercise_name, feel_rating, bpm_start, bpm_end")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      setSessions(data ?? []);
      setLoading(false);
    };
    fetchSessions();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Metrics
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthSessions = sessions.filter((s) => new Date(s.date) >= monthStart);
  const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  const weekSessions = sessions.filter((s) => new Date(s.date) >= weekAgo);

  const bpmSessions = sessions.filter((s) => s.bpm_start != null && s.bpm_end != null);
  const avgBpmGain = bpmSessions.length > 0
    ? Math.round(bpmSessions.reduce((sum, s) => sum + (s.bpm_end! - s.bpm_start!), 0) / bpmSessions.length)
    : null;

  // Chart data
  const chartMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    chartMap[d.toISOString().split("T")[0]] = 0;
  }
  sessions.forEach((s) => {
    if (chartMap[s.date] !== undefined) {
      chartMap[s.date] += s.duration_minutes;
    }
  });
  const chartData = Object.entries(chartMap).map(([date, minutes]) => ({
    date: formatDateShort(date),
    minutes,
  }));

  const recentFive = sessions.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading">Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Practice This Month</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading">{formatDuration(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions This Week</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading">{weekSessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg BPM Gain</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading">{avgBpmGain !== null ? `+${avgBpmGain}` : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Practice Minutes (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(var(--chart-line))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(var(--chart-line))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-xl font-heading mb-4">Recent Sessions</h2>
        {recentFive.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-2">No sessions yet!</p>
            <Link to="/log" className="text-primary font-medium hover:underline">
              Log your first session →
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentFive.map((s) => (
              <Card key={s.id} className="p-4 flex items-center gap-4">
                <div className="text-sm text-muted-foreground w-24 shrink-0">{formatDate(s.date)}</div>
                <div className="flex-1 font-medium truncate">
                  {s.exercise_name || s.focus_area}
                </div>
                <div className="text-sm text-muted-foreground">{formatDuration(s.duration_minutes)}</div>
                {s.feel_rating && <StarRating value={s.feel_rating} readonly size="sm" />}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
