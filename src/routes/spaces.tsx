import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listSpaces, listEventRequests } from "@/lib/crm";
import { Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/spaces")({
  component: SpacesPage,
});

const COLOR_MAP: Record<string, string> = {
  orange: "bg-primary/15 border-primary/40",
  blue: "bg-accent/15 border-accent/40",
  yellow: "bg-yellow-500/15 border-yellow-500/40",
  white: "bg-foreground/10 border-foreground/30",
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

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary">
          Venue
        </p>
        <h1 className="text-display text-2xl font-semibold">Spaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {spaces.length} bookable spaces across the Pyramid.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {spaces.map((s) => {
          const upcoming = events
            .filter(
              (e) =>
                e.space_id === s.id &&
                e.preferred_date &&
                ["proposal", "confirmed", "in_progress"].includes(e.status),
            )
            .sort((a, b) =>
              (a.preferred_date ?? "").localeCompare(b.preferred_date ?? ""),
            )
            .slice(0, 4);
          const tint = COLOR_MAP[s.accent_color ?? "white"] ?? COLOR_MAP.white;
          return (
            <article
              key={s.id}
              className={`rounded-lg border p-5 transition ${tint}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.space_type}
                  </p>
                  <h2 className="text-display text-lg font-semibold">
                    {s.name}
                  </h2>
                </div>
                <span className="rounded-md bg-background/60 px-2 py-1 text-xs">
                  €{s.hourly_rate}/h
                </span>
              </div>
              {s.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {s.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> Capacity {s.capacity}
              </div>

              <div className="mt-4 border-t border-border/60 pt-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Upcoming bookings
                </p>
                {upcoming.length === 0 ? (
                  <p className="text-xs text-muted-foreground/70">None scheduled.</p>
                ) : (
                  <ul className="space-y-1">
                    {upcoming.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Calendar className="h-3 w-3 text-primary/80" />
                        <span className="font-medium">{e.preferred_date}</span>
                        <span className="text-muted-foreground">
                          {e.event_type}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
