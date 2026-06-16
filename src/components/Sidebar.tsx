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
  ChevronRight,
  LogOut,
} from "lucide-react";
import { listThreads, createThread, deleteThread } from "@/lib/threads";
import pyramidImg from "@/assets/pyramid.jpg";

const NAV = [
  { to: "/", label: "Assistant", icon: Sparkles, exact: true },
  { to: "/requests", label: "Pipeline", icon: LayoutGrid },
  { to: "/spaces", label: "Venue", icon: Building2 },
  { to: "/equipment", label: "Inventory", icon: Wrench },
  { to: "/tasks", label: "Operations", icon: ListChecks },
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
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar/40 backdrop-blur-2xl">
      {/* BRAND & HERO */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={pyramidImg}
          alt="Pyramid of Tirana"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/60 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              Elite Access
            </p>
          </div>
          <h1 className="text-display mt-1 text-2xl font-bold leading-tight tracking-tight text-foreground">
            Pyramid
          </h1>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
          <Plus className="h-4 w-4" />
          New event request
        </button>
      </div>

      {/* MAIN NAV */}
      <nav className="space-y-1 px-3 py-2">
        <h2 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Management
        </h2>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? location.pathname === "/" || /^\/[0-9a-f-]{36}$/i.test(location.pathname)
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                active
                  ? "bg-primary/10 text-primary shadow-[inset_0px_0px_12px_rgba(255,255,255,0.02)]"
                  : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${active ? "text-primary" : "text-primary/40 group-hover:text-primary"}`}
                />
                {item.label}
              </div>
              {active && (
                <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* THREADS */}
      <div className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-2 flex items-center justify-between px-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            Assistant threads
          </h2>
          {isLoading && <div className="h-1 w-1 rounded-full bg-primary animate-ping" />}
        </div>

        {threads.length === 0 && !isLoading && (
          <p className="px-4 py-4 text-center text-xs italic text-muted-foreground/30">
            No active conversations.
          </p>
        )}

        <ul className="space-y-1">
          {threads.map((t) => {
            const active = location.pathname.includes(t.id);
            return (
              <li key={t.id} className="group relative">
                <Link
                  to="/$threadId"
                  params={{ threadId: t.id }}
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 pr-10 text-xs font-medium transition-all duration-300 ${
                    active
                      ? "bg-white/5 text-foreground ring-1 ring-white/10"
                      : "text-sidebar-foreground/50 hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <MessageSquare
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-primary/30 group-hover:text-primary"}`}
                  />
                  <span className="line-clamp-2 leading-relaxed">{t.title}</span>
                  <ChevronRight
                    className={`absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 transition-all group-hover:opacity-100 ${active ? "text-primary opacity-100" : "text-muted-foreground"}`}
                  />
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm("Delete this event request?")) del.mutate(t.id);
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* USER FOOTER */}
      <div className="border-t border-sidebar-border/30 p-4">
        <div className="glass-card flex items-center gap-3 rounded-2xl p-3 ring-1 ring-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-accent/80 font-bold text-primary-foreground shadow-inner">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-bold tracking-wide text-foreground">John Doe</p>
            <p className="truncate text-[10px] font-medium text-muted-foreground/60 uppercase">
              Senior Coordinator
            </p>
          </div>
          <button className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
