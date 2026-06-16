import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getEventRequest,
  listSpaces,
  listEquipment,
  listEventEquipment,
  listTasksForEvent,
  reserveEquipment,
  removeEquipmentReservation,
  updateEventRequest,
  createTask,
  updateTask,
  deleteTask,
  checkSpaceAvailability,
  generateProposal,
  EVENT_STATUSES,
  TEAMS,
  type EventStatus,
  type Team,
  type TaskStatus,
} from "@/lib/crm";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/requests/$id")({
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: ev } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventRequest(id),
  });
  const { data: spaces = [] } = useQuery({
    queryKey: ["spaces"],
    queryFn: listSpaces,
  });
  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment"],
    queryFn: listEquipment,
  });
  const { data: reserved = [] } = useQuery({
    queryKey: ["event_equipment", id],
    queryFn: () => listEventEquipment(id),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => listTasksForEvent(id),
  });
  const { data: conflicts = [] } = useQuery({
    queryKey: ["availability", ev?.space_id, ev?.preferred_date, id],
    queryFn: () =>
      ev?.space_id && ev?.preferred_date
        ? checkSpaceAvailability(ev.space_id, ev.preferred_date, id)
        : Promise.resolve([]),
    enabled: !!ev?.space_id && !!ev?.preferred_date,
  });

  const [showProposal, setShowProposal] = useState(false);
  const [equipPick, setEquipPick] = useState("");
  const [equipQty, setEquipQty] = useState(1);

  if (!ev) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const space = spaces.find((s) => s.id === ev.space_id);
  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["event", id] });
    qc.invalidateQueries({ queryKey: ["event_requests"] });
    qc.invalidateQueries({ queryKey: ["event_equipment", id] });
    qc.invalidateQueries({ queryKey: ["tasks", id] });
    qc.invalidateQueries({ queryKey: ["availability"] });
  };

  const update = async (patch: Parameters<typeof updateEventRequest>[1]) => {
    await updateEventRequest(id, patch);
    refreshAll();
  };

  const proposalEquipment = reserved.map((r) => {
    const item = equipment.find((e) => e.id === r.equipment_id);
    return {
      name: item?.name ?? "Item",
      quantity: r.quantity,
      daily_rate: item?.daily_rate ?? 0,
    };
  });

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/requests" })}
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to pipeline
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary">
              {ev.client_name}
            </p>
            <h1 className="text-display text-2xl font-semibold">
              {ev.event_type}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={ev.status}
              onChange={(e) =>
                update({ status: e.target.value as EventStatus })
              }
              className="rounded-md border border-border bg-input px-3 py-2 text-sm"
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowProposal(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <FileText className="h-4 w-4" /> Proposal
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        {/* DETAILS */}
        <section className="space-y-4 lg:col-span-2">
          <Card title="Event details">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Editable
                label="Client name"
                value={ev.client_name}
                onSave={(v) => update({ client_name: v })}
              />
              <Editable
                label="Email"
                value={ev.client_email ?? ""}
                onSave={(v) => update({ client_email: v || null })}
              />
              <Editable
                label="Phone"
                value={ev.client_phone ?? ""}
                onSave={(v) => update({ client_phone: v || null })}
              />
              <Editable
                label="Event type"
                value={ev.event_type}
                onSave={(v) => update({ event_type: v })}
              />
              <Editable
                label="Attendance"
                value={ev.attendance?.toString() ?? ""}
                type="number"
                onSave={(v) =>
                  update({ attendance: v ? parseInt(v) : null })
                }
              />
              <Editable
                label="Date"
                type="date"
                value={ev.preferred_date ?? ""}
                onSave={(v) => update({ preferred_date: v || null })}
              />
              <Editable
                label="Start"
                type="time"
                value={ev.start_time?.slice(0, 5) ?? ""}
                onSave={(v) => update({ start_time: v || null })}
              />
              <Editable
                label="End"
                type="time"
                value={ev.end_time?.slice(0, 5) ?? ""}
                onSave={(v) => update({ end_time: v || null })}
              />
            </div>
          </Card>

          <Card title="Space & availability">
            <div className="flex items-center gap-3">
              <select
                value={ev.space_id ?? ""}
                onChange={(e) =>
                  update({ space_id: e.target.value || null })
                }
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="">— Select a space —</option>
                {spaces
                  .filter(
                    (s) => !ev.attendance || s.capacity >= ev.attendance,
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (cap. {s.capacity}, €{s.hourly_rate}/h)
                    </option>
                  ))}
              </select>
            </div>
            {ev.space_id && ev.preferred_date && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-md border p-3 text-sm ${
                  conflicts.length
                    ? "border-destructive/40 bg-destructive/5 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                }`}
              >
                {conflicts.length ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  {conflicts.length ? (
                    <>
                      <strong>Conflict:</strong> {conflicts.length} other
                      booking(s) on this date.
                    </>
                  ) : (
                    <>Space is available on {ev.preferred_date}.</>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card title="Equipment & reservations">
            <div className="mb-3 flex items-center gap-2">
              <select
                value={equipPick}
                onChange={(e) => setEquipPick(e.target.value)}
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="">— Pick equipment —</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.category} · {eq.name} (avail. {eq.quantity_available})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={equipQty}
                onChange={(e) => setEquipQty(parseInt(e.target.value) || 1)}
                className="w-20 rounded-md border border-border bg-input px-3 py-2 text-sm"
              />
              <button
                disabled={!equipPick}
                onClick={async () => {
                  await reserveEquipment(id, equipPick, equipQty);
                  setEquipPick("");
                  setEquipQty(1);
                  refreshAll();
                }}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Reserve
              </button>
            </div>
            {reserved.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No equipment reserved yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {reserved.map((r) => {
                  const item = equipment.find((e) => e.id === r.equipment_id);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span>
                        <span className="text-muted-foreground">
                          {item?.category}
                        </span>{" "}
                        · {item?.name} × {r.quantity}
                      </span>
                      <button
                        onClick={async () => {
                          await removeEquipmentReservation(r.id);
                          refreshAll();
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Notes">
            <textarea
              defaultValue={ev.notes ?? ""}
              onBlur={(e) => update({ notes: e.target.value || null })}
              rows={4}
              className="w-full resize-none rounded-md border border-border bg-input p-3 text-sm"
              placeholder="Internal notes, client preferences, special requirements…"
            />
          </Card>
        </section>

        {/* TASKS */}
        <section>
          <Card title="Task coordination">
            <TaskList
              eventId={id}
              tasks={tasks}
              onChange={refreshAll}
            />
          </Card>
        </section>
      </div>

      {showProposal && (
        <ProposalModal
          text={generateProposal(ev, space, proposalEquipment)}
          onClose={() => setShowProposal(false)}
          onSend={async () => {
            await update({ status: "proposal" });
            setShowProposal(false);
          }}
        />
      )}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Editable({
  label,
  value,
  type = "text",
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  onSave: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        defaultValue={value}
        onBlur={(e) => {
          if (e.target.value !== value) onSave(e.target.value);
        }}
        className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function TaskList({
  eventId,
  tasks,
  onChange,
}: {
  eventId: string;
  tasks: import("@/lib/crm").Task[];
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    team: "technical" as Team,
    title: "",
    assignee: "",
    due_date: "",
  });

  return (
    <div className="space-y-3">
      {TEAMS.map((team) => {
        const items = tasks.filter((t) => t.team === team);
        if (items.length === 0) return null;
        return (
          <div key={team}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
              {team}
            </p>
            <ul className="mt-1 space-y-1">
              {items.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    onChange={async (e) => {
                      await updateTask(t.id, {
                        status: e.target.checked
                          ? "done"
                          : ("todo" as TaskStatus),
                      });
                      onChange();
                    }}
                  />
                  <div className="flex-1">
                    <p
                      className={
                        t.status === "done"
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {t.title}
                    </p>
                    {(t.assignee || t.due_date) && (
                      <p className="text-[10px] text-muted-foreground">
                        {t.assignee}
                        {t.assignee && t.due_date ? " · " : ""}
                        {t.due_date}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await deleteTask(t.id);
                      onChange();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {adding ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title) return;
            await createTask({
              event_id: eventId,
              team: form.team,
              title: form.title,
              assignee: form.assignee || null,
              due_date: form.due_date || null,
            });
            setForm({ team: "technical", title: "", assignee: "", due_date: "" });
            setAdding(false);
            onChange();
          }}
          className="space-y-2 rounded-md border border-border bg-background/40 p-3"
        >
          <select
            value={form.team}
            onChange={(e) => setForm({ ...form, team: e.target.value as Team })}
            className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs"
          >
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <input
              placeholder="Assignee"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              className="flex-1 rounded-md border border-border bg-input px-2 py-1.5 text-xs"
            />
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="rounded-md border border-border bg-input px-2 py-1.5 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </button>
            <button className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Add task
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3 w-3" /> Add task
        </button>
      )}
    </div>
  );
}

function ProposalModal({
  text,
  onClose,
  onSend,
}: {
  text: string;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-display font-semibold">Proposal preview</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button
              onClick={onSend}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Mark as sent
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-y-auto whitespace-pre-wrap p-6 text-sm text-foreground">
          {text}
        </pre>
      </div>
    </div>
  );
}
