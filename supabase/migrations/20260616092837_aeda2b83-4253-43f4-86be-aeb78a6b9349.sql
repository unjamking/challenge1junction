
CREATE TABLE public.threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New event request',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  parts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);
CREATE INDEX idx_threads_updated ON public.threads(updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT ALL ON public.threads TO service_role;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read threads" ON public.threads FOR SELECT USING (true);
CREATE POLICY "anyone can insert threads" ON public.threads FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update threads" ON public.threads FOR UPDATE USING (true);
CREATE POLICY "anyone can delete threads" ON public.threads FOR DELETE USING (true);

CREATE POLICY "anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "anyone can delete messages" ON public.messages FOR DELETE USING (true);
