import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import type { EventRequest, Space } from "@/lib/crm";
import {
  Calendar as CalendarIcon,
  X,
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 p-4 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-[2.5rem] glass-card shadow-[0_32px_128px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-display text-2xl font-bold tracking-tight text-foreground">
                {space.name} Availability
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/60">
                Venue Temporal Alignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/5 text-muted-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[500px]">
          <div className="flex-1 p-8 border-r border-white/5 flex items-center justify-center bg-white/[0.01]">
            <div className="calendar-elite">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={setSelected}
                modifiers={{ booked: bookedDays }}
                modifiersStyles={{
                  booked: {
                    backgroundColor: "rgba(249, 115, 22, 0.15)",
                    color: "#f97316",
                    fontWeight: "900",
                    borderRadius: "12px",
                    boxShadow: "0 0 12px rgba(249, 115, 22, 0.2)",
                  },
                  selected: {
                    backgroundColor: "#f97316",
                    color: "black",
                    fontWeight: "900",
                    borderRadius: "12px",
                    boxShadow: "0 0 20px rgba(249, 115, 22, 0.4)",
                  },
                }}
              />
            </div>
          </div>

          <div className="w-full md:w-80 flex flex-col p-6 overflow-y-auto bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                {selected ? format(selected, "MMMM d, yyyy") : "Select a date"}
              </h3>
              <Sparkles className="h-3.5 w-3.5 text-primary/20" />
            </div>

            {dayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-4 px-4 text-center">
                <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-emerald-500/5 text-emerald-500 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5 animate-pulse">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400/80">Optimal Availability</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase font-bold tracking-widest leading-relaxed">
                    No conflicting dossiers found for this timestamp.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {dayEvents.length} Active Booking(s)
                  </p>
                </div>

                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="group rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05] hover:ring-1 hover:ring-primary/20 shadow-md"
                  >
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                      {ev.event_type}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground/60 mb-4">
                      {ev.client_name}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-primary/40" />
                        <span className="text-[10px] font-black uppercase text-foreground/70">
                          {ev.start_time?.slice(0, 5)} - {ev.end_time?.slice(0, 5)}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                        {ev.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .calendar-elite .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #f97316;
          --rdp-background-color: rgba(249, 115, 22, 0.1);
          margin: 0;
        }
        .calendar-elite .rdp-day_today {
          color: #f97316;
          font-weight: bold;
        }
        .calendar-elite .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
