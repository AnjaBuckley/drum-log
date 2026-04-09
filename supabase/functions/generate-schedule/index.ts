import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert drum teacher and practice coach. Based on the student's answers, generate a detailed weekly practice schedule plan.

Return your response as valid JSON with this structure:
{
  "summary": "A brief overview of the plan and its goals",
  "weeklyHours": number,
  "days": [
    {
      "day": "Monday",
      "blocks": [
        {
          "duration": "15 min",
          "activity": "Warm-up: Single stroke rolls",
          "focus": "Technique",
          "bpmRange": "60-80",
          "tips": "Focus on even stick height"
        }
      ]
    }
  ],
  "monthlyGoals": ["Goal 1", "Goal 2"],
  "tips": ["General tip 1", "General tip 2"]
}

Make the schedule realistic, progressive, and tailored to their level and available time. Include specific exercises, BPM ranges, and practical tips. If they have less time, prioritize the most impactful exercises.`;

    const userPrompt = `Here are the student's answers:
- Skill Level: ${answers.skillLevel}
- Years of Experience: ${answers.experience}
- Available Practice Time: ${answers.practiceTime} minutes per day
- Practice Days Per Week: ${answers.daysPerWeek}
- Musical Genres: ${answers.genres}
- Goals: ${answers.goals}
- Weaknesses/Areas to Improve: ${answers.weaknesses}
- Equipment Available: ${answers.equipment}
- Current Exercises: ${answers.currentExercises || "None specified"}

Generate a personalized weekly practice schedule.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let schedule;
    try {
      schedule = JSON.parse(content);
    } catch {
      schedule = { raw: content };
    }

    return new Response(JSON.stringify({ schedule }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-schedule error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
