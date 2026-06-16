import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listEventRequests,
  listSpaces,
  createEventRequest,
  deleteEventRequest,
  EVENT_STATUSES,
  type EventRequest,
  type EventStatus,
} from "@/lib/crm";
import {
  Plus,
  Trash2,
  Calendar,
  Users,
  FileImport,
  Loader2,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { parseInquiry } from "@/lib/import.server";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
});

const STATUS_LABEL: Record<EventStatus, string> = {
  inquiry: "Inquiry",
  proposal: "Proposal sent",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_GLOW: Record<EventStatus, string> = {
  inquiry: "bg-muted-foreground/40 shadow-[0_0_8px_rgba(148,163,184,0.3)]",
  proposal: "bg-accent shadow-[0_0_12px_rgba(96,165,250,0.5)]",
  confirmed: "bg-primary shadow-[0_0_12px_rgba(249,115,22,0.5)]",
  in_progress: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]",
  completed: "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]",
  cancelled: "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.5)]",
};

function RequestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: events = [] } = useQuery({
    queryKey: ["event_requests"],
    queryFn: listEventRequests,
  });
  const { data: spaces = [] } = useQuery({
    queryKey: ["spaces"],
    queryFn: listSpaces,
  });
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [initialData, setInitialData] = useState<Partial<EventRequest> | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["event_requests"] });

  const grouped = EVENT_STATUSES.map((s) => ({
    status: s,
    items: events.filter((e) => e.status === s),
  }));

  return (
    <div className="h-full flex flex-col bg-background/20 relative overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[128px]" />
      </div>

      <header className="relative z-10 glass-header flex items-center justify-between px-8 py-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-4 bg-primary rounded-full" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Pipeline
            </p>
          </div>
          <h1 className="text-display text-3xl font-bold tracking-tight text-foreground">
            Event Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search events..."
              className="bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground/40 w-48"
            />
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-white/10 active:scale-95"
          >
            <FileImport className="h-4 w-4 text-primary/80" /> Import
          </button>
          <button
            onClick={() => {
              setInitialData(null);
              setShowNew(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" /> New request
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-6 p-8 min-w-max">
          {grouped.map((col) => (
            <section key={col.status} className="flex flex-col w-80 h-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${STATUS_GLOW[col.status]}`} />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/80">
                    {STATUS_LABEL[col.status]}
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground ring-1 ring-white/10">
                  {col.items.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {col.items.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] text-muted-foreground/20">
                    <p className="text-[10px] uppercase font-bold tracking-widest">No requests</p>
                  </div>
                )}
                {col.items.map((ev) => {
                  const space = spaces.find((s) => s.id === ev.space_id);
                  return (
                    <article
                      key={ev.id}
                      onClick={() => navigate({ to: "/requests/$id", params: { id: ev.id } })}
                      className="group cursor-pointer glass-card rounded-2xl p-5 transition-all duration-500 hover:ring-primary/40 hover:shadow-[0_0_32px_rgba(249,115,22,0.1)] hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-display font-bold leading-tight truncate group-hover:text-primary transition-colors">
                            {ev.event_type}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            {ev.client_name}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this request?")) {
                              deleteEventRequest(ev.id).then(refresh);
                            }
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {ev.preferred_date && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 ring-1 ring-white/5 text-[10px] font-bold text-foreground/70 uppercase">
                            <Calendar className="h-3 w-3 text-primary/60" />
                            {new Date(ev.preferred_date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        )}
                        {ev.attendance && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 ring-1 ring-white/5 text-[10px] font-bold text-foreground/70">
                            <Users className="h-3 w-3 text-primary/60" /> {ev.attendance}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        {space ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                            {space.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-white/5 text-muted-foreground/40 italic">
                            Unassigned
                          </span>
                        )}
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {showNew && (
        <NewRequestModal
          spaces={spaces}
          initialData={initialData}
          onClose={() => setShowNew(false)}
          onCreated={(ev) => {
            setShowNew(false);
            refresh();
            navigate({ to: "/requests/$id", params: { id: ev.id } });
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onParsed={(data) => {
            setInitialData(data);
            setShowImport(false);
            setShowNew(true);
          }}
        />
      )}
    </div>
  );
}

function ImportModal({
  onClose,
  onParsed,
}: {
  onClose: () => void;
  onParsed: (data: Partial<EventRequest>) => void;
}) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 p-4 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[2rem] glass-card p-8 shadow-[0_32px_128px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <FileImport className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-display text-2xl font-bold tracking-tight">Import Inquiry</h2>
            <p className="text-xs text-muted-foreground/60 font-medium">
              Extracting excellence from details.
            </p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw inquiry text from email or WhatsApp..."
            className="w-full h-48 rounded-2xl bg-white/5 p-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 ring-1 ring-white/10 transition-all shadow-inner"
          />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Discard
          </button>
          <button
            onClick={async () => {
              setParsing(true);
              try {
                const data = await parseInquiry({ data: text });
                onParsed(data as Partial<EventRequest>);
              } catch (e) {
                console.error(e);
                alert("Failed to parse inquiry.");
              } finally {
                setParsing(false);
              }
            }}
            disabled={!text || parsing}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Process Details"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRequestModal({
  spaces,
  initialData,
  onClose,
  onCreated,
}: {
  spaces: { id: string; name: string; capacity: number }[];
  initialData: Partial<EventRequest> | null;
  onClose: () => void;
  onCreated: (ev: EventRequest) => void;
}) {
  const [form, setForm] = useState({
    client_name: initialData?.client_name ?? "",
    client_email: initialData?.client_email ?? "",
    client_phone: initialData?.client_phone ?? "",
    event_type: initialData?.event_type ?? "",
    attendance: initialData?.attendance?.toString() ?? "",
    preferred_date: initialData?.preferred_date ?? "",
    start_time: initialData?.start_time ?? "",
    end_time: initialData?.end_time ?? "",
    space_id: "",
    notes: initialData?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 p-4 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[2rem] glass-card p-8 shadow-[0_32px_128px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-display text-2xl font-bold tracking-tight">New event request</h2>
              <p className="text-xs text-muted-foreground/60 font-medium tracking-wide">
                Enter the fundamental requirements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/5 text-muted-foreground"
          >
            <Plus className="h-5 w-5 rotate-45" />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const ev = await createEventRequest({
                client_name: form.client_name,
                client_email: form.client_email || null,
                client_phone: form.client_phone || null,
                event_type: form.event_type,
                attendance: form.attendance ? parseInt(form.attendance) : null,
                preferred_date: form.preferred_date || null,
                start_time: form.start_time || null,
                end_time: form.end_time || null,
                space_id: form.space_id || null,
                notes: form.notes || null,
                status: "inquiry",
              });
              onCreated(ev);
            } finally {
              setSaving(false);
            }
          }}
          className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm"
        >
          <Field label="Client name" required col={2}>
            <input
              required
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.client_email}
              onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.client_phone}
              onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Event type" required col={2}>
            <input
              required
              placeholder="e.g. Diamond Gala, Global Summit..."
              value={form.event_type}
              onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Attendance">
            <input
              type="number"
              value={form.attendance}
              onChange={(e) => setForm({ ...form, attendance: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={form.preferred_date}
              onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Start Time">
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="End Time">
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="input-elite"
            />
          </Field>
          <Field label="Preferred Space" col={2}>
            <select
              value={form.space_id}
              onChange={(e) => setForm({ ...form, space_id: e.target.value })}
              className="input-elite"
            >
              <option value="">— Selection Pending —</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Cap. {s.capacity})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Additional Notes" col={2}>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-elite resize-none"
            />
          </Field>

          <div className="col-span-2 mt-4 flex justify-end gap-3 border-t border-white/5 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
            >
              {saving ? "Registering..." : "Initiate Request"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .input-elite {
          width: 100%;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px 14px;
          font-size: 14px;
          transition: all 0.3s;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .input-elite:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1), inset 0 2px 4px rgba(0,0,0,0.1);
        }
        select.input-elite option {
          background: #111;
          color: white;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  col,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  col?: number;
}) {
  return (
    <label className={col === 2 ? "col-span-2 block" : "block"}>
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
