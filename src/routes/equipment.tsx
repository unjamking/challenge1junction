import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listEquipment } from "@/lib/crm";

export const Route = createFileRoute("/equipment")({
  component: EquipmentPage,
});

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
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary">Inventory</p>
        <h1 className="text-display text-2xl font-semibold">Equipment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AV, lighting, staging, furniture and catering inventory.
        </p>
      </header>

      <div className="space-y-6 p-6">
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              {cat}
            </h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">Available</th>
                    <th className="px-4 py-2 text-right font-medium">Daily rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((e) => (
                    <tr key={e.id} className="hover:bg-accent/5">
                      <td className="px-4 py-3">{e.name}</td>
                      <td className="px-4 py-3 text-right">{e.quantity_available}</td>
                      <td className="px-4 py-3 text-right">€{e.daily_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
