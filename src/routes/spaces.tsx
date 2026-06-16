import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listSpaces, listEventRequests, type Space } from "@/lib/crm";
import { Users, Calendar, Eye, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { SpaceCalendarModal } from "@/components/SpaceCalendar";

export const Route = createFileRoute("/spaces")({
  component: SpacesPage,
});

const COLOR_MAP: Record<string, string> = {
  orange: "from-primary/20 to-primary/5 border-primary/20",
  blue: "from-accent/20 to-accent/5 border-accent/20",
  yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20",
  white: "from-white/10 to-white/0 border-white/10",
};

function SpacesPage() {
  const { data: spaces = [] } = useQuery({
    queryKey: ["spaces"],
    queryFn: listSpaces,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["event_requests"],
    queryFn: listEventRequests,
  });

  const [viewingSpace, setViewingSpace] = useState<Space | null>(null);

  return (
    <div className="h-full flex flex-col bg-background/20 relative overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[128px]" />
      </div>

      <header className="relative z-10 glass-header flex items-center justify-between px-8 py-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-4 bg-primary rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Venue</p>
          </div>
          <h1 className="text-display text-3xl font-bold tracking-tight text-foreground">
            Spatial Portfolio
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 ring-1 ring-white/10 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {spaces.length} Prime Locations
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {spaces.map((s) => {
            const upcoming = events
              .filter(
                (e) =>
                  e.space_id === s.id &&
                  e.preferred_date &&
                  ["proposal", "confirmed", "in_progress"].includes(e.status),
              )
              .sort((a, b) => (a.preferred_date ?? "").localeCompare(b.preferred_date ?? ""))
              .slice(0, 3);
            const tint = COLOR_MAP[s.accent_color ?? "white"] ?? COLOR_MAP.white;

            return (
              <article
                key={s.id}
                className="group relative overflow-hidden rounded-[2rem] border glass-card transition-all duration-700 hover:ring-primary/40 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1"
              >
                {/* Accent glow */}
                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${tint}`} />

                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                        <MapPin className="h-3 w-3" /> {s.space_type}
                      </p>
                      <h2 className="text-display text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {s.name}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black leading-none text-foreground">
                        €{s.hourly_rate}
                      </p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                        Per Hour
                      </p>
                    </div>
                  </div>

                  {s.description && (
                    <p className="mb-6 line-clamp-2 italic text-sm leading-relaxed text-muted-foreground/80">
                      "{s.description}"
                    </p>
                  )}

                  <div className="mb-8 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-primary/60 ring-1 ring-white/5">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          Capacity
                        </p>
                        <p className="text-xs font-bold text-foreground">{s.capacity} Guests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingSpace(s)}
                        className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground shadow-lg ring-1 ring-white/10 transition-all hover:bg-primary hover:text-primary-foreground hover:ring-primary active:scale-95"
                      >
                        <Eye className="h-3 w-3" /> Check Availability
                      </button>
                    </div>
                  </div>

                  <div className="relative border-t border-white/5 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
                        Upcoming Calendar
                      </p>
                      <Sparkles className="h-3 w-3 text-primary/20" />
                    </div>

                    {upcoming.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.02] px-4 py-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/20">
                          Pristine Schedule
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {upcoming.map((e) => (
                          <li
                            key={e.id}
                            className="flex cursor-default items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5 transition-all hover:ring-primary/20"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-3.5 w-3.5 text-primary/40" />
                              <span className="text-[11px] font-bold uppercase text-foreground/80">
                                {new Date(e.preferred_date!).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            <span className="max-w-[120px] truncate text-[10px] font-medium text-muted-foreground">
                              {e.event_type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {viewingSpace && (
        <SpaceCalendarModal
          space={viewingSpace}
          events={events}
          onClose={() => setViewingSpace(null)}
        />
      )}
    </div>
  );
}
