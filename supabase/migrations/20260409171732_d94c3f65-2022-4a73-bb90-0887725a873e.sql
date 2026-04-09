
-- Table to store scheduled practice events (from AI-generated plans)
CREATE TABLE public.scheduled_practices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_name TEXT NOT NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  activity TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  bpm_range TEXT,
  tips TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  logged_session_id UUID REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_practices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own scheduled practices"
  ON public.scheduled_practices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled practices"
  ON public.scheduled_practices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled practices"
  ON public.scheduled_practices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled practices"
  ON public.scheduled_practices FOR DELETE
  USING (auth.uid() = user_id);

-- Index for calendar queries
CREATE INDEX idx_scheduled_practices_user_date ON public.scheduled_practices(user_id, date);
