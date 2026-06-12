import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type ReceiptData = {
  donorName: string;
  donorEmail: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  donationType: string;
  completedAt: string | null | undefined;
  receiptId: string | null | undefined;
};

export function downloadDonationReceipt(data: ReceiptData): void {
  const doc = new jsPDF();
  const green: [number, number, number] = [61, 141, 122];
  const darkBg: [number, number, number] = [15, 43, 29];

  // Header band
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("HopeBuilt", 20, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 230, 220);
  doc.text("Donation Receipt", 20, 32);

  // Receipt meta
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  const dateStr = data.completedAt
    ? format(new Date(data.completedAt), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");
  doc.text(`Date: ${dateStr}`, 130, 52);
  if (data.receiptId) {
    doc.text(`Receipt #: ${data.receiptId}`, 130, 60);
  }

  // "Thank you" section
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 43, 29);
  doc.text("Thank You for Your Generosity!", 20, 55);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Your donation to ${data.campaignTitle} has been received.`,
    20,
    65,
    { maxWidth: 100 },
  );

  // Details table
  autoTable(doc, {
    startY: 80,
    head: [["Detail", "Value"]],
    body: [
      ["Donor Name", data.donorName],
      ["Email", data.donorEmail],
      ["Campaign", data.campaignTitle],
      [
        "Amount",
        `$${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${data.currency.toUpperCase()}`,
      ],
      ["Type", data.donationType === "monthly" ? "Monthly Recurring" : "One-Time"],
      ["Status", "Completed"],
      ["Date", dateStr],
    ],
    theme: "striped",
    headStyles: {
      fillColor: green,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 11,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    alternateRowStyles: { fillColor: [245, 253, 250] },
  });

  // Footer note
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "This receipt confirms your charitable contribution. Please retain for your records.",
    20,
    finalY,
    { maxWidth: 170 },
  );

  doc.setFillColor(...green);
  doc.rect(0, 282, 210, 15, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("hopebuilt.org  •  Built with ♥ for a better world", 105, 291, {
    align: "center",
  });

  const safeName = data.campaignTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`hopebuilt-receipt-${safeName}.pdf`);
}
