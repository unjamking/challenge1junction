import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  MessageSquare,
  LayoutGrid,
  Building2,
  Wrench,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { listThreads, createThread, deleteThread } from "@/lib/threads";
import pyramidImg from "@/assets/pyramid.jpg";

const NAV = [
  { to: "/", label: "Assistant", icon: Sparkles, exact: true },
  { to: "/requests", label: "Requests", icon: LayoutGrid },
  { to: "/spaces", label: "Spaces", icon: Building2 },
  { to: "/equipment", label: "Equipment", icon: Wrench },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
];

export function Sidebar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: listThreads,
  });

  const create = useMutation({
    mutationFn: createThread,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/$threadId", params: { threadId: t.id } });
    },
  });

  const del = useMutation({
    mutationFn: deleteThread,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (location.pathname.includes(id)) navigate({ to: "/" });
    },
  });

  return (
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="relative h-32 overflow-hidden border-b border-sidebar-border">
        <img
          src={pyramidImg}
          alt="Pyramid of Tirana"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Operations</p>
          <h1 className="text-display text-lg font-semibold leading-tight">Pyramid of Tirana</h1>
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New event request
        </button>
      </div>

      <nav className="border-b border-sidebar-border px-2 py-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? location.pathname === "/" || /^\/[0-9a-f-]{36}$/i.test(location.pathname)
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60"
              }`}
            >
              <Icon className="h-4 w-4 text-primary/80" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-3">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Assistant threads
        </p>
        {isLoading && <p className="px-2 text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && threads.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">No threads yet.</p>
        )}
        <ul className="space-y-1">
          {threads.map((t) => {
            const active = location.pathname.includes(t.id);
            return (
              <li key={t.id} className="group relative">
                <Link
                  to="/$threadId"
                  params={{ threadId: t.id }}
                  className={`flex items-start gap-2 rounded-md px-2 py-2 pr-8 text-sm transition ${
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80"
                  }`}
                >
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="line-clamp-2 leading-snug">{t.title}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Delete this event request?")) del.mutate(t.id);
                  }}
                  className="absolute right-1 top-1.5 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-sidebar-border p-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        Event Operations Assistant
      </div>
    </aside>
  );
}
