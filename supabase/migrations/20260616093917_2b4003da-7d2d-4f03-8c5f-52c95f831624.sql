
-- SPACES
CREATE TABLE public.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  space_type text NOT NULL,
  capacity int NOT NULL,
  description text,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  accent_color text DEFAULT 'orange',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaces TO anon, authenticated;
GRANT ALL ON public.spaces TO service_role;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read spaces" ON public.spaces FOR SELECT USING (true);
CREATE POLICY "anyone can insert spaces" ON public.spaces FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update spaces" ON public.spaces FOR UPDATE USING (true);
CREATE POLICY "anyone can delete spaces" ON public.spaces FOR DELETE USING (true);

-- EQUIPMENT
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quantity_available int NOT NULL DEFAULT 1,
  daily_rate numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment TO anon, authenticated;
GRANT ALL ON public.equipment TO service_role;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "anyone can insert equipment" ON public.equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update equipment" ON public.equipment FOR UPDATE USING (true);
CREATE POLICY "anyone can delete equipment" ON public.equipment FOR DELETE USING (true);

-- EVENT REQUESTS
CREATE TABLE public.event_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  event_type text NOT NULL,
  attendance int,
  preferred_date date,
  start_time time,
  end_time time,
  space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'inquiry',
  notes text,
  thread_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_requests TO anon, authenticated;
GRANT ALL ON public.event_requests TO service_role;
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read event_requests" ON public.event_requests FOR SELECT USING (true);
CREATE POLICY "anyone can insert event_requests" ON public.event_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update event_requests" ON public.event_requests FOR UPDATE USING (true);
CREATE POLICY "anyone can delete event_requests" ON public.event_requests FOR DELETE USING (true);

-- EVENT EQUIPMENT
CREATE TABLE public.event_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_requests(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_equipment TO anon, authenticated;
GRANT ALL ON public.event_equipment TO service_role;
ALTER TABLE public.event_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read event_equipment" ON public.event_equipment FOR SELECT USING (true);
CREATE POLICY "anyone can insert event_equipment" ON public.event_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update event_equipment" ON public.event_equipment FOR UPDATE USING (true);
CREATE POLICY "anyone can delete event_equipment" ON public.event_equipment FOR DELETE USING (true);

-- TASKS
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_requests(id) ON DELETE CASCADE,
  team text NOT NULL,
  title text NOT NULL,
  description text,
  assignee text,
  due_date date,
  status text NOT NULL DEFAULT 'todo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon, authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "anyone can insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_spaces_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_event_requests_updated_at BEFORE UPDATE ON public.event_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- SEED SPACES
INSERT INTO public.spaces (name, space_type, capacity, description, hourly_rate, accent_color) VALUES
('Main Atrium', 'multipurpose', 600, 'The signature central hall under the glass canopy. Ideal for galas, large receptions, and exhibitions.', 450, 'white'),
('Auditorium', 'auditorium', 320, 'Tiered seating with full AV. Conferences, screenings, and keynote presentations.', 280, 'orange'),
('Rooftop Terrace', 'outdoor', 200, 'Panoramic views over Tirana. Cocktail receptions, brand launches, sunset events.', 220, 'blue'),
('Orange Cube Studio', 'studio', 40, 'Intimate workshop space inside the signature orange cube. Roundtables and creative sessions.', 90, 'orange'),
('Blue Cube Studio', 'studio', 40, 'Quiet meeting cube with daylight. Press briefings and small workshops.', 90, 'blue'),
('Yellow Cube Studio', 'studio', 35, 'Compact studio for podcast recordings, interviews, and breakout sessions.', 80, 'yellow'),
('Cinema Hall', 'screening', 120, 'Dolby-equipped screening room. Film premieres, private viewings.', 180, 'white'),
('Co-working Loft', 'workshop', 80, 'Flexible loft with modular furniture. Hackathons, training, full-day workshops.', 120, 'white'),
('Outdoor Amphitheater', 'outdoor', 800, 'Stepped concrete amphitheater on the south face. Concerts, public talks, festivals.', 380, 'white');

-- SEED EQUIPMENT
INSERT INTO public.equipment (name, category, quantity_available, daily_rate) VALUES
('Wireless Microphone', 'audio', 16, 25),
('Lavalier Mic Set', 'audio', 8, 30),
('Line Array PA System', 'audio', 2, 450),
('DJ Booth + CDJs', 'audio', 1, 380),
('4K Projector', 'video', 4, 180),
('LED Wall (3x2m panel)', 'video', 6, 320),
('Confidence Monitor', 'video', 3, 60),
('Live Streaming Kit', 'video', 2, 250),
('Moving Head Light', 'lighting', 24, 35),
('Uplighter (RGBW)', 'lighting', 40, 12),
('Follow Spot', 'lighting', 2, 90),
('Modular Stage Deck (2x1m)', 'staging', 30, 45),
('Lectern with Mic', 'staging', 4, 40),
('Pipe & Drape Backdrop', 'staging', 12, 30),
('Banquet Round Table (10pax)', 'furniture', 40, 18),
('Cocktail High Table', 'furniture', 60, 12),
('Chiavari Chair', 'furniture', 500, 4),
('Lounge Sofa Set', 'furniture', 8, 95),
('Coat Check Rack', 'furniture', 6, 25),
('Espresso Bar Station', 'catering', 2, 220),
('Outdoor Heater', 'climate', 12, 35);
