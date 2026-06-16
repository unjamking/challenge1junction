import { supabase } from "@/integrations/supabase/client";

export type EventStatus =
  | "inquiry"
  | "proposal"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TaskStatus = "todo" | "in_progress" | "done";
export type Team =
  | "technical"
  | "catering"
  | "security"
  | "cleaning"
  | "coordination";

export interface Space {
  id: string;
  name: string;
  space_type: string;
  capacity: number;
  description: string | null;
  hourly_rate: number;
  accent_color: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  quantity_available: number;
  daily_rate: number;
}

export interface EventRequest {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  event_type: string;
  attendance: number | null;
  preferred_date: string | null;
  start_time: string | null;
  end_time: string | null;
  space_id: string | null;
  status: EventStatus;
  notes: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  event_id: string;
  team: Team;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  status: TaskStatus;
}

export const EVENT_STATUSES: EventStatus[] = [
  "inquiry",
  "proposal",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export const TEAMS: Team[] = [
  "technical",
  "catering",
  "security",
  "cleaning",
  "coordination",
];

// SPACES
export async function listSpaces(): Promise<Space[]> {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .order("capacity", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Space[];
}

// EQUIPMENT
export async function listEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .order("category", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Equipment[];
}

// EVENT REQUESTS
export async function listEventRequests(): Promise<EventRequest[]> {
  const { data, error } = await supabase
    .from("event_requests")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRequest[];
}

export async function getEventRequest(id: string): Promise<EventRequest> {
  const { data, error } = await supabase
    .from("event_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as EventRequest;
}

export async function createEventRequest(
  input: Partial<EventRequest> & { client_name: string; event_type: string },
): Promise<EventRequest> {
  const { data, error } = await supabase
    .from("event_requests")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as EventRequest;
}

export async function updateEventRequest(
  id: string,
  patch: Partial<EventRequest>,
): Promise<EventRequest> {
  const { data, error } = await supabase
    .from("event_requests")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as EventRequest;
}

export async function deleteEventRequest(id: string) {
  const { error } = await supabase.from("event_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function checkSpaceAvailability(
  spaceId: string,
  date: string,
  excludeId?: string,
): Promise<EventRequest[]> {
  let q = supabase
    .from("event_requests")
    .select("*")
    .eq("space_id", spaceId)
    .eq("preferred_date", date)
    .in("status", ["proposal", "confirmed", "in_progress"]);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EventRequest[];
}

// TASKS
export async function listTasksForEvent(eventId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function listAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(
  input: Partial<Task> & { event_id: string; team: Team; title: string },
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// EVENT EQUIPMENT
export interface EventEquipmentRow {
  id: string;
  event_id: string;
  equipment_id: string;
  quantity: number;
}

export async function listEventEquipment(
  eventId: string,
): Promise<EventEquipmentRow[]> {
  const { data, error } = await supabase
    .from("event_equipment")
    .select("*")
    .eq("event_id", eventId);
  if (error) throw error;
  return (data ?? []) as EventEquipmentRow[];
}

export async function reserveEquipment(
  eventId: string,
  equipmentId: string,
  quantity: number,
) {
  const { error } = await supabase
    .from("event_equipment")
    .insert({ event_id: eventId, equipment_id: equipmentId, quantity });
  if (error) throw error;
}

export async function removeEquipmentReservation(id: string) {
  const { error } = await supabase.from("event_equipment").delete().eq("id", id);
  if (error) throw error;
}

// Proposal text generator
export function generateProposal(
  ev: EventRequest,
  space: Space | undefined,
  equipment: { name: string; quantity: number; daily_rate: number }[],
): string {
  const dateStr = ev.preferred_date
    ? new Date(ev.preferred_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "TBD";
  const timeStr =
    ev.start_time && ev.end_time
      ? `${ev.start_time.slice(0, 5)} – ${ev.end_time.slice(0, 5)}`
      : "TBD";
  const hours =
    ev.start_time && ev.end_time
      ? Math.max(
          1,
          (parseInt(ev.end_time.slice(0, 2)) -
            parseInt(ev.start_time.slice(0, 2))) || 4,
        )
      : 4;
  const spaceCost = space ? space.hourly_rate * hours : 0;
  const equipCost = equipment.reduce(
    (s, e) => s + e.quantity * e.daily_rate,
    0,
  );
  const total = spaceCost + equipCost;

  return `# Event Proposal — Pyramid of Tirana

**Prepared for:** ${ev.client_name}${ev.client_email ? ` (${ev.client_email})` : ""}
**Event:** ${ev.event_type}
**Date:** ${dateStr}
**Time:** ${timeStr}
**Expected attendance:** ${ev.attendance ?? "TBD"}

---

## Space
${
  space
    ? `**${space.name}** — ${space.space_type}, capacity ${space.capacity}
${space.description ?? ""}

Rate: €${space.hourly_rate}/hour × ${hours}h = **€${spaceCost.toFixed(2)}**`
    : "_No space assigned yet._"
}

## Equipment & Services
${
  equipment.length
    ? equipment
        .map(
          (e) =>
            `- ${e.name} × ${e.quantity} — €${(e.quantity * e.daily_rate).toFixed(2)}`,
        )
        .join("\n")
    : "_No equipment reserved._"
}

**Equipment subtotal:** €${equipCost.toFixed(2)}

---

## Total
**€${total.toFixed(2)}** (excl. VAT)

${ev.notes ? `\n## Notes\n${ev.notes}\n` : ""}

We look forward to hosting you at the Pyramid of Tirana.
`;
}
