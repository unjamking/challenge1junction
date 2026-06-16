import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAllTasks,
  listEventRequests,
  updateTask,
  TEAMS,
  type Team,
  type TaskStatus,
} from "@/lib/crm";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

function TasksPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: tasks = [] } = useQuery({
    queryKey: ["all_tasks"],
    queryFn: listAllTasks,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["event_requests"],
    queryFn: listEventRequests,
  });

  const eventMap = new Map(events.map((e) => [e.id, e]));

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary">Operations</p>
        <h1 className="text-display text-2xl font-semibold">All tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tasks.length} task(s) across {TEAMS.length} teams.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
        {STATUSES.map((status) => (
          <section key={status} className="rounded-lg border border-border bg-card/40 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {status.replace("_", " ")} · {tasks.filter((t) => t.status === status).length}
            </h2>
            <ul className="space-y-2">
              {tasks
                .filter((t) => t.status === status)
                .map((t) => {
                  const ev = eventMap.get(t.event_id);
                  return (
                    <li
                      key={t.id}
                      className="rounded-md border border-border bg-background/60 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight">{t.title}</p>
                        <select
                          value={t.status}
                          onChange={async (e) => {
                            await updateTask(t.id, {
                              status: e.target.value as TaskStatus,
                            });
                            qc.invalidateQueries({ queryKey: ["all_tasks"] });
                          }}
                          className="rounded border border-border bg-input px-1 py-0.5 text-[10px]"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-primary">
                        {t.team}
                      </p>
                      {ev && (
                        <button
                          onClick={() =>
                            navigate({
                              to: "/requests/$id",
                              params: { id: ev.id },
                            })
                          }
                          className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {ev.event_type} · {ev.client_name}
                        </button>
                      )}
                      {(t.assignee || t.due_date) && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {t.assignee}
                          {t.assignee && t.due_date ? " · " : ""}
                          {t.due_date}
                        </p>
                      )}
                    </li>
                  );
                })}
              {tasks.filter((t) => t.status === status).length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nothing here.</p>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
