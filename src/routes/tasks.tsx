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
import { ClipboardList, CheckCircle2, Clock, User, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Strategizing",
  in_progress: "Executing",
  done: "Finalized",
};

const TEAM_COLORS: Record<Team, string> = {
  technical: "text-blue-400",
  catering: "text-amber-400",
  security: "text-red-400",
  cleaning: "text-emerald-400",
  coordination: "text-primary",
};

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
    <div className="h-full flex flex-col bg-background/20 relative overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[128px]" />
      </div>

      <header className="relative z-10 glass-header flex items-center justify-between px-8 py-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-4 bg-primary rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Operations
            </p>
          </div>
          <h1 className="text-display text-3xl font-bold tracking-tight text-foreground">
            Mission Control
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 ring-1 ring-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {tasks.length} Operational Units
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-6 p-8 min-w-max">
          {STATUSES.map((status) => {
            const statusTasks = tasks.filter((t) => t.status === status);
            return (
              <section key={status} className="flex flex-col w-96 h-full">
                <div className="flex items-center justify-between mb-6 px-4">
                  <div className="flex items-center gap-3">
                    {status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-primary/60" />
                    )}
                    <h2 className="text-display text-xl font-bold tracking-tight text-foreground/90">
                      {STATUS_LABELS[status]}
                    </h2>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/5 text-muted-foreground ring-1 ring-white/10">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                  {statusTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] text-muted-foreground/10">
                      <ClipboardList className="h-8 w-8 mb-2 opacity-5" />
                      <p className="text-[10px] uppercase font-bold tracking-[0.3em]">
                        Sector Clear
                      </p>
                    </div>
                  )}
                  {statusTasks.map((t) => {
                    const ev = eventMap.get(t.event_id);
                    return (
                      <article
                        key={t.id}
                        className="group glass-card rounded-[1.5rem] p-5 border border-white/5 transition-all duration-500 hover:ring-1 hover:ring-primary/20 hover:bg-white/[0.04] shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {t.title}
                          </h3>
                          <div className="relative">
                            <select
                              value={t.status}
                              onChange={async (e) => {
                                await updateTask(t.id, { status: e.target.value as TaskStatus });
                                qc.invalidateQueries({ queryKey: ["all_tasks"] });
                              }}
                              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary/80 focus:outline-none cursor-pointer hover:bg-white/10 transition-all"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s} className="bg-[#111]">
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-white/5 ring-1 ring-white/5 ${TEAM_COLORS[t.team as Team]}`}
                          >
                            {t.team}
                          </span>
                        </div>

                        {ev && (
                          <button
                            onClick={() => navigate({ to: "/requests/$id", params: { id: ev.id } })}
                            className="group/btn mb-4 flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-primary/20 hover:bg-primary/[0.02]"
                          >
                            <div className="min-w-0 text-left">
                              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                Assigned Dossier
                              </p>
                              <p className="truncate text-xs font-bold text-foreground/70">
                                {ev.event_type}
                              </p>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/20 transition-all group-hover/btn:translate-x-1 group-hover/btn:text-primary" />
                          </button>
                        )}

                        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-primary/40" />
                            <span>{t.assignee || "Unassigned"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-primary/40" />
                            <span>{t.due_date || "TBD"}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
