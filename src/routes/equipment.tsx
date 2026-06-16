import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listEquipment } from "@/lib/crm";
import {
  Wrench,
  Monitor,
  Lightbulb,
  Sofa,
  Coffee,
  Package,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/equipment")({
  component: EquipmentPage,
});

const CAT_ICONS: Record<string, LucideIcon> = {
  av: Monitor,
  lighting: Lightbulb,
  furniture: Sofa,
  catering: Coffee,
  staging: Package,
  security: ShieldCheck,
};

function EquipmentPage() {
  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment"],
    queryFn: listEquipment,
  });

  const grouped = equipment.reduce<Record<string, typeof equipment>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-background/20 relative overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[128px]" />
      </div>

      <header className="relative z-10 glass-header flex items-center justify-between px-8 py-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-4 bg-primary rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Inventory
            </p>
          </div>
          <h1 className="text-display text-3xl font-bold tracking-tight text-foreground">
            Technical Assets
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 ring-1 ring-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Total Items: {equipment.length}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mx-auto max-w-7xl space-y-12">
          {Object.entries(grouped).map(([cat, items]) => {
            const Icon = CAT_ICONS[cat.toLowerCase()] || Wrench;
            return (
              <section key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-display text-2xl font-bold tracking-tight text-foreground">
                      {cat}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">
                      Elite {cat} Solutions
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((e) => (
                    <article
                      key={e.id}
                      className="group glass-card rounded-2xl p-5 border border-white/5 transition-all duration-300 hover:ring-1 hover:ring-primary/30 hover:bg-white/[0.05] hover:-translate-y-1 shadow-xl"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-foreground text-sm tracking-wide group-hover:text-primary transition-colors">
                            {e.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">
                            €{e.daily_rate}
                          </span>
                          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-1">
                            Daily
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${e.quantity_available > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                          />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {e.quantity_available > 0 ? "In Stock" : "Allocated"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-foreground">
                            {e.quantity_available}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/30 uppercase">
                            Units
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 glass-header py-4 px-8 border-t border-white/5">
        <p className="text-center text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/20">
          Managed Asset Registry · Pyramid of Tirana Elite
        </p>
      </div>
    </div>
  );
}
