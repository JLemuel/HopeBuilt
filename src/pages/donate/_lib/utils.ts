export const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#3d8d7a",
    colorBackground: "#ffffff",
    colorText: "#121212",
    colorDanger: "#ef4444",
    fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
    spacingUnit: "4px",
    borderRadius: "8px",
  },
  rules: {
    ".Input": {
      border: "1px solid #d9d9d9",
      padding: "14px 16px",
      fontSize: "15px",
      boxShadow: "none",
      fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
    },
    ".Input:focus": {
      border: "1px solid #3d8d7a",
      boxShadow: "0 0 0 1px rgba(61,141,122,0.3)",
    },
    ".Label": {
      fontSize: "14px",
      color: "#505050",
      marginBottom: "6px",
      fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
    },
    ".Tab": {
      fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
    },
    ".TabLabel": {
      fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
    },
    ".AccordionItem": {
      border: "1px solid #d9d9d9",
      borderRadius: "8px",
      marginBottom: "8px",
    },
    ".AccordionItemHeader": {
      padding: "12px 14px",
      color: "transparent",
    },
    ".AccordionItemHeader--selected": {
      borderColor: "#3d8d7a",
    },
  },
};

export const STRIPE_FONTS = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap",
  },
];

export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
  }
  return cleaned;
}
