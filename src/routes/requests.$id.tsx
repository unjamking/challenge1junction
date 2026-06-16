import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  checkEquipmentAvailability,
  generateProposal,
  EVENT_STATUSES,
  TEAMS,
  type EventStatus,
  type Team,
  type TaskStatus,
  type EventRequest,
  type Space,
} from "@/lib/crm";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Settings,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { exportProposalAsPDF } from "@/lib/pdf";

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
  const [checkingEquip, setCheckingEquip] = useState(false);
  const [equipAvailability, setEquipAvailability] = useState<{
    available: number;
    reserved: number;
  } | null>(null);

  if (!ev) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
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

  const update = async (patch: Partial<EventRequest>) => {
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

  const checkEquip = async (eqId: string) => {
    if (!eqId || !ev.preferred_date) {
      setEquipAvailability(null);
      return;
    }
    setCheckingEquip(true);
    try {
      const res = await checkEquipmentAvailability(eqId, ev.preferred_date, id);
      setEquipAvailability(res);
    } finally {
      setCheckingEquip(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/20 relative overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[128px]" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[128px]" />
      </div>

      <header className="relative z-10 glass-header px-8 py-6">
        <button
          onClick={() => navigate({ to: "/requests" })}
          className="group mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Pipeline
        </button>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest ring-1 ring-primary/20">
                {ev.status}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {ev.client_name}
              </p>
            </div>
            <h1 className="text-display text-4xl font-bold tracking-tight text-foreground truncate">
              {ev.event_type}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card flex items-center rounded-xl p-1 ring-1 ring-white/10 shadow-lg">
              {EVENT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => update({ status: s })}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    ev.status === s
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowProposal(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <FileText className="h-4 w-4" /> Generate Proposal
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* ESSENTIALS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EssentialCard
                icon={Calendar}
                label="Event Date"
                value={
                  ev.preferred_date
                    ? new Date(ev.preferred_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Not set"
                }
              />
              <EssentialCard
                icon={Clock}
                label="Duration"
                value={
                  ev.start_time && ev.end_time
                    ? `${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(0, 5)}`
                    : "TBD"
                }
              />
              <EssentialCard
                icon={Users}
                label="Attendance"
                value={ev.attendance?.toString() ?? "TBD"}
              />
              <EssentialCard
                icon={MapPin}
                label="Venue Space"
                value={space?.name ?? "Unassigned"}
              />
            </div>

            {/* DETAILS SECTION */}
            <EliteCard title="Core Specifications" icon={ClipboardCheck}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-2">
                <EditableElite
                  label="Primary Contact"
                  value={ev.client_name}
                  onSave={(v) => update({ client_name: v })}
                />
                <EditableElite
                  label="Contact Email"
                  value={ev.client_email ?? "—"}
                  onSave={(v) => update({ client_email: v || null })}
                />
                <EditableElite
                  label="Contact Phone"
                  value={ev.client_phone ?? "—"}
                  onSave={(v) => update({ client_phone: v || null })}
                />
                <EditableElite
                  label="Event Designation"
                  value={ev.event_type}
                  onSave={(v) => update({ event_type: v })}
                />
                <EditableElite
                  label="Expected Attendance"
                  value={ev.attendance?.toString() ?? "—"}
                  type="number"
                  onSave={(v) => update({ attendance: v ? parseInt(v) : null })}
                />
                <EditableElite
                  label="Preferred Date"
                  type="date"
                  value={ev.preferred_date ?? ""}
                  onSave={(v) => update({ preferred_date: v || null })}
                />
                <EditableElite
                  label="Inception"
                  type="time"
                  value={ev.start_time?.slice(0, 5) ?? ""}
                  onSave={(v) => update({ start_time: v || null })}
                />
                <EditableElite
                  label="Conclusion"
                  type="time"
                  value={ev.end_time?.slice(0, 5) ?? ""}
                  onSave={(v) => update({ end_time: v || null })}
                />
              </div>
            </EliteCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* SPACE CARD */}
              <EliteCard title="Spatial Alignment" icon={MapPin}>
                <div className="space-y-4">
                  <select
                    value={ev.space_id ?? ""}
                    onChange={(e) => update({ space_id: e.target.value || null })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all"
                  >
                    <option value="" className="bg-[#111]">
                      Unassigned
                    </option>
                    {spaces
                      .filter((s) => !ev.attendance || s.capacity >= ev.attendance)
                      .map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#111]">
                          {s.name} (Cap. {s.capacity}, €{s.hourly_rate}/h)
                        </option>
                      ))}
                  </select>

                  {ev.space_id && ev.preferred_date && (
                    <div
                      className={`flex items-start gap-3 rounded-2xl p-4 text-sm transition-all duration-500 border ${
                        conflicts.length
                          ? "bg-destructive/5 border-destructive/20 text-destructive-foreground"
                          : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {conflicts.length ? (
                        <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold uppercase tracking-wider text-[10px] mb-0.5">
                          Availability Check
                        </p>
                        {conflicts.length ? (
                          <p className="text-xs">
                            Scheduling conflict detected. {conflicts.length} existing booking(s) on
                            this date.
                          </p>
                        ) : (
                          <p className="text-xs">
                            Venue availability confirmed for {ev.preferred_date}.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </EliteCard>

              {/* EQUIPMENT CARD */}
              <EliteCard title="Technical & Service Inventory" icon={Settings}>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={equipPick}
                      onChange={(e) => {
                        setEquipPick(e.target.value);
                        checkEquip(e.target.value);
                      }}
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-foreground focus:outline-none transition-all"
                    >
                      <option value="" className="bg-[#111]">
                        Inventory Catalogue
                      </option>
                      {equipment.map((eq) => (
                        <option key={eq.id} value={eq.id} className="bg-[#111]">
                          {eq.category} · {eq.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={equipQty}
                      onChange={(e) => setEquipQty(parseInt(e.target.value) || 1)}
                      className="w-16 rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-sm text-center focus:outline-none transition-all"
                    />
                    <button
                      disabled={
                        !equipPick || (equipAvailability && equipQty > equipAvailability.available)
                      }
                      onClick={async () => {
                        await reserveEquipment(id, equipPick, equipQty);
                        setEquipPick("");
                        setEquipQty(1);
                        setEquipAvailability(null);
                        refreshAll();
                      }}
                      className="rounded-xl bg-primary px-4 py-2 text-primary-foreground font-bold text-xs shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:grayscale"
                    >
                      Allocate
                    </button>
                  </div>

                  {checkingEquip && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Querying Inventory...
                    </div>
                  )}

                  {equipAvailability && (
                    <div
                      className={`rounded-xl p-3 text-[10px] font-bold uppercase tracking-wider border ${
                        equipQty > equipAvailability.available
                          ? "bg-destructive/5 border-destructive/20 text-destructive"
                          : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {equipQty > equipAvailability.available
                        ? `Shortage: Only ${equipAvailability.available} units remain.`
                        : `Stock Confirmed: ${equipAvailability.available} units remaining.`}
                    </div>
                  )}

                  <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {reserved.map((r) => {
                      const item = equipment.find((e) => e.id === r.equipment_id);
                      return (
                        <div
                          key={r.id}
                          className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
                        >
                          <div>
                            <p className="text-[10px] font-bold uppercase text-primary/60 mb-0.5">
                              {item?.category}
                            </p>
                            <p className="text-sm font-semibold">
                              {item?.name}{" "}
                              <span className="text-muted-foreground/60 ml-1">× {r.quantity}</span>
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              await removeEquipmentReservation(r.id);
                              refreshAll();
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {reserved.length === 0 && (
                      <p className="text-center py-4 text-xs italic text-muted-foreground/20">
                        No assets allocated.
                      </p>
                    )}
                  </div>
                </div>
              </EliteCard>
            </div>

            {/* NOTES */}
            <EliteCard title="Strategic Memoranda" icon={FileText}>
              <textarea
                defaultValue={ev.notes ?? ""}
                onBlur={(e) => update({ notes: e.target.value || null })}
                rows={5}
                className="w-full resize-none rounded-2xl bg-white/[0.02] border border-white/5 p-4 text-sm text-foreground placeholder:text-muted-foreground/20 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all shadow-inner"
                placeholder="Internal directives, client sensibilities, and unique operational requirements..."
              />
            </EliteCard>
          </div>

          {/* SIDE COLUMN: TASKS */}
          <div className="lg:col-span-4 h-fit sticky top-8">
            <EliteCard title="Operational Coordination" icon={ClipboardCheck}>
              <EliteTaskList eventId={id} tasks={tasks} onChange={refreshAll} />
            </EliteCard>
          </div>
        </div>
      </div>

      {showProposal && (
        <ProposalModal
          ev={ev}
          space={space}
          equipment={proposalEquipment}
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

function EssentialCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 ring-1 ring-white/5 shadow-xl transition-all hover:ring-primary/20">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-primary/60 mb-2">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  );
}

function EliteCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-[2rem] p-6 ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-primary/80 ring-1 ring-white/10 shadow-lg">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-display text-xl font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EditableElite({
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
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  return (
    <div className="group relative py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1.5">
        {label}
      </p>
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (val !== value) onSave(val);
        }}
        className={`w-full bg-transparent border-none p-0 text-sm font-semibold text-foreground focus:ring-0 transition-all ${editing ? "text-primary" : "group-hover:text-primary"}`}
        onFocus={() => setEditing(true)}
      />
      <div
        className={`absolute bottom-0 left-0 h-[1px] bg-primary transition-all duration-500 ${editing ? "w-full" : "w-0 group-hover:w-8"}`}
      />
    </div>
  );
}

function EliteTaskList({
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
    <div className="space-y-6">
      {TEAMS.map((team) => {
        const items = tasks.filter((t) => t.team === team);
        return (
          <div key={team}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/80">
                {team}
              </p>
              <span className="text-[10px] font-bold text-muted-foreground/30">{items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((t) => (
                <li
                  key={t.id}
                  className="group relative flex items-center gap-3 rounded-2xl bg-white/[0.02] border border-white/5 p-3 pr-10 transition-all hover:bg-white/[0.05] hover:ring-1 hover:ring-white/10 shadow-sm"
                >
                  <button
                    onClick={async () => {
                      await updateTask(t.id, { status: t.status === "done" ? "todo" : "done" });
                      onChange();
                    }}
                    className={`h-5 w-5 shrink-0 rounded-lg border-2 transition-all flex items-center justify-center ${
                      t.status === "done"
                        ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                        : "border-white/20 hover:border-primary/60"
                    }`}
                  >
                    {t.status === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate transition-all ${t.status === "done" ? "line-through text-muted-foreground/40" : "text-foreground group-hover:text-primary"}`}
                    >
                      {t.title}
                    </p>
                    {(t.assignee || t.due_date) && (
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mt-1">
                        {t.assignee} {t.assignee && t.due_date ? "•" : ""} {t.due_date}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("Delete task?")) {
                        await deleteTask(t.id);
                        onChange();
                      }
                    }}
                    className="absolute right-2 p-1.5 rounded-lg text-muted-foreground/20 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
          className="space-y-3 rounded-[1.5rem] bg-white/[0.03] border border-white/10 p-5 shadow-inner animate-in slide-in-from-top-4 duration-300"
        >
          <select
            value={form.team}
            onChange={(e) => setForm({ ...form, team: e.target.value as Team })}
            className="w-full rounded-xl bg-background border border-white/10 px-3 py-2 text-[11px] font-bold uppercase text-foreground focus:outline-none"
          >
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Directives title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl bg-background border border-white/10 px-3 py-2 text-xs font-semibold focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              placeholder="Assignee"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              className="flex-1 rounded-xl bg-background border border-white/10 px-3 py-2 text-[10px] font-medium focus:outline-none"
            />
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="rounded-xl bg-background border border-white/10 px-3 py-2 text-[10px] font-medium focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-foreground"
            >
              Abort
            </button>
            <button className="rounded-lg bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95">
              Deploy Task
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-4 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02]"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Add Strategic Task
        </button>
      )}
    </div>
  );
}

function ProposalModal({
  ev,
  space,
  equipment,
  text,
  onClose,
  onSend,
}: {
  ev: EventRequest;
  space: Space | undefined;
  equipment: { name: string; quantity: number; daily_rate: number }[];
  text: string;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-2xl animate-in fade-in duration-500"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[2.5rem] glass-card shadow-[0_64px_256px_rgba(0,0,0,0.7)] ring-1 ring-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-10 py-6 bg-white/[0.02]">
          <div>
            <h2 className="text-display text-2xl font-bold tracking-tight">Proposal Curataria</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/60 mt-1">
              Review · Transmit · Secure
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => exportProposalAsPDF(ev, space, equipment)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-white/10 shadow-lg group"
            >
              <Download className="h-4 w-4 text-primary group-hover:animate-bounce" /> Export
              Document
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(text);
                alert("Proposal text captured to clipboard.");
              }}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-white/10 shadow-lg"
            >
              <Copy className="h-4 w-4 text-primary" /> Extract Text
            </button>
            <button
              onClick={onSend}
              className="rounded-xl bg-primary px-8 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Authorize Dispatch
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-10 bg-white/[0.01]">
          <div className="mx-auto max-w-2xl bg-white/[0.03] p-10 rounded-3xl shadow-inner border border-white/5 relative">
            <div className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/10 pointer-events-none select-none">
              Pyramid Elite
            </div>
            <pre className="prose-chat whitespace-pre-wrap font-sans leading-relaxed text-foreground/80 italic">
              {text}
            </pre>
          </div>
        </div>
        <div className="px-10 py-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
          <button
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" /> Return to Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
