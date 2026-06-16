import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listEventRequests,
  listSpaces,
  createEventRequest,
  updateEventRequest,
  deleteEventRequest,
  EVENT_STATUSES,
  type EventRequest,
  type EventStatus,
} from "@/lib/crm";
import { Plus, Trash2, Calendar, Users, FileImport, Loader2 } from "lucide-react";
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

const STATUS_TINT: Record<EventStatus, string> = {
  inquiry: "border-muted-foreground/30 bg-muted/40",
  proposal: "border-accent/40 bg-accent/10",
  confirmed: "border-primary/50 bg-primary/10",
  in_progress: "border-primary/70 bg-primary/15",
  completed: "border-emerald-500/40 bg-emerald-500/5",
  cancelled: "border-destructive/40 bg-destructive/5",
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
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary">Pipeline</p>
          <h1 className="text-display text-2xl font-semibold">Event requests</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <FileImport className="h-4 w-4" /> Import Inquiry
          </button>
          <button
            onClick={() => {
              setInitialData(null);
              setShowNew(true);
            }}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New request
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((col) => (
          <section key={col.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {STATUS_LABEL[col.status]}
              </h2>
              <span className="text-xs text-muted-foreground">{col.items.length}</span>
            </div>
            {col.items.length === 0 && (
              <p className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                Empty
              </p>
            )}
            {col.items.map((ev) => {
              const space = spaces.find((s) => s.id === ev.space_id);
              return (
                <article
                  key={ev.id}
                  onClick={() => navigate({ to: "/requests/$id", params: { id: ev.id } })}
                  className={`group cursor-pointer rounded-lg border p-4 transition hover:border-primary/60 ${STATUS_TINT[ev.status]}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium leading-tight">{ev.event_type}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{ev.client_name}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this request?")) {
                          deleteEventRequest(ev.id).then(refresh);
                        }
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {ev.preferred_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {ev.preferred_date}
                      </span>
                    )}
                    {ev.attendance && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {ev.attendance}
                      </span>
                    )}
                    {space && (
                      <span className="rounded bg-background/60 px-1.5 py-0.5">{space.name}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ))}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-display text-xl font-semibold">Import Inquiry</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste an email or WhatsApp inquiry to automatically extract details.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste inquiry text here..."
          className="mt-4 h-48 w-full rounded-md border border-border bg-input p-3 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
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
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Process Inquiry"}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-display text-xl font-semibold">New event request</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture the basics. You can refine details after creation.
        </p>
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
          className="mt-4 grid grid-cols-2 gap-3 text-sm"
        >
          <Field label="Client name" required col={2}>
            <input
              required
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.client_email}
              onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.client_phone}
              onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Event type" required col={2}>
            <input
              required
              placeholder="Gala dinner, conference, product launch…"
              value={form.event_type}
              onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Attendance">
            <input
              type="number"
              value={form.attendance}
              onChange={(e) => setForm({ ...form, attendance: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Preferred date">
            <input
              type="date"
              value={form.preferred_date}
              onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Start">
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="End">
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Space" col={2}>
            <select
              value={form.space_id}
              onChange={(e) => setForm({ ...form, space_id: e.target.value })}
              className="input"
            >
              <option value="">— Match later —</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (cap. {s.capacity})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" col={2}>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
            />
          </Field>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create request"}
            </button>
          </div>
        </form>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-input);color:var(--color-foreground);border-radius:6px;padding:8px 10px;font-size:14px}.input:focus{outline:2px solid var(--color-primary);outline-offset:1px}`}</style>
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
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}
