import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay } from "date-fns";
import type { EventRequest, Space } from "@/lib/crm";
import { Calendar as CalendarIcon, X, AlertTriangle } from "lucide-react";

export function SpaceCalendarModal({
  space,
  events,
  onClose,
}: {
  space: Space;
  events: EventRequest[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const spaceEvents = events.filter(
    (e) =>
      e.space_id === space.id &&
      e.preferred_date &&
      ["proposal", "confirmed", "in_progress"].includes(e.status),
  );

  const selectedDateStr = selected ? format(selected, "yyyy-MM-dd") : null;
  const dayEvents = spaceEvents.filter((e) => e.preferred_date === selectedDateStr);

  const bookedDays = spaceEvents.map((e) => new Date(e.preferred_date!));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h2 className="text-display font-semibold">{space.name} Availability</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[450px]">
          <div className="flex-1 p-4 border-r border-border flex items-center justify-center bg-muted/5">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={{ booked: bookedDays }}
              modifiersStyles={{
                booked: {
                  backgroundColor: "rgba(249, 115, 22, 0.2)",
                  color: "#f97316",
                  fontWeight: "bold",
                },
                selected: { backgroundColor: "#f97316", color: "white" },
              }}
            />
          </div>

          <div className="w-full md:w-72 flex flex-col p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {selected ? format(selected, "MMMM d, yyyy") : "Select a date"}
            </h3>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-emerald-500 font-medium bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
                Space is fully available.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" /> {dayEvents.length} Conflicting
                  booking(s)
                </p>
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-md border border-border bg-background p-3 text-sm"
                  >
                    <p className="font-semibold">{ev.event_type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ev.client_name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                        {ev.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ev.start_time?.slice(0, 5)} - {ev.end_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
