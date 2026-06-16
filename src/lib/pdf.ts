import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EventRequest, Space } from "./crm";

export function exportProposalAsPDF(
  ev: EventRequest,
  space: Space | undefined,
  equipment: { name: string; quantity: number; daily_rate: number }[],
) {
  const doc = new jsPDF();
  const dateStr = ev.preferred_date
    ? new Date(ev.preferred_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "TBD";

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text("Event Proposal", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Pyramid of Tirana — Event Operations", 14, 28);
  doc.line(14, 32, 196, 32);

  // Client Details
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text("Client Information", 14, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${ev.client_name}`, 14, 52);
  doc.text(`Email: ${ev.client_email || "N/A"}`, 14, 57);
  doc.text(`Phone: ${ev.client_phone || "N/A"}`, 14, 62);

  // Event Details
  doc.setFont("helvetica", "bold");
  doc.text("Event Details", 110, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Type: ${ev.event_type}`, 110, 52);
  doc.text(`Date: ${dateStr}`, 110, 57);
  doc.text(`Attendance: ${ev.attendance ?? "TBD"}`, 110, 62);

  // Space
  doc.setFont("helvetica", "bold");
  doc.text("Venue Space", 14, 75);
  doc.setFont("helvetica", "normal");
  if (space) {
    doc.text(`${space.name} (${space.space_type})`, 14, 82);
    doc.text(`Capacity: ${space.capacity}`, 14, 87);
  } else {
    doc.text("No space assigned yet.", 14, 82);
  }

  // Equipment Table
  const hours =
    ev.start_time && ev.end_time
      ? Math.max(1, parseInt(ev.end_time.slice(0, 2)) - parseInt(ev.start_time.slice(0, 2)) || 4)
      : 4;
  const spaceCost = space ? space.hourly_rate * hours : 0;

  const tableData = [
    ...(space
      ? [[space.name, "Space Hire", "1", `€${space.hourly_rate}`, `€${spaceCost.toFixed(2)}`]]
      : []),
    ...equipment.map((e) => [
      e.name,
      "Equipment",
      e.quantity.toString(),
      `€${e.daily_rate}`,
      `€${(e.quantity * e.daily_rate).toFixed(2)}`,
    ]),
  ];

  autoTable(doc, {
    startY: 95,
    head: [["Item", "Category", "Qty", "Unit Price", "Total"]],
    body: tableData,
    foot: [
      [
        "",
        "",
        "",
        "Total (excl. VAT)",
        `€${(spaceCost + equipment.reduce((s, e) => s + e.quantity * e.daily_rate, 0)).toFixed(2)}`,
      ],
    ],
    theme: "striped",
    headStyles: { fillStyle: "F", fillColor: [249, 115, 22] }, // orange-500
  });

  // Footer / Notes
  // @ts-expect-error - jspdf-autotable adds lastAutoTable to the doc
  const lastAutoTable = (doc as any).lastAutoTable;
  const finalY = lastAutoTable?.finalY || 150;
  if (ev.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 14, finalY + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(ev.notes, 180);
    doc.text(splitNotes, 14, finalY + 22);
  }

  doc.save(`Proposal_${ev.client_name.replace(/\s+/g, "_")}.pdf`);
}
