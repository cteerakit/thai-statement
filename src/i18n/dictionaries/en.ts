import { PRODUCT_NAME } from "@/i18n/brand";

export const dictionary = {
  meta: {
    title: PRODUCT_NAME,
    description:
      "Convert digital PDF bank statements from SCB, KBank, and KTB to CSV or Excel. Free, no login required.",
  },
  nav: {
    privacy: "Privacy",
    history: "History",
    signIn: "Sign in",
    signOut: "Sign out",
    language: "Language",
  },
  footer: {
    processed:
      "PDFs are processed in memory and discarded.",
    privacy: "Privacy",
    terms: "Terms",
  },
  home: {
    title: "Thai bank statement converter",
    subtitle:
      "Upload a digital PDF statement and download clean CSV or Excel files. No account required — sign in only if you want saved history.",
    convertTitle: "Convert your statement",
    convertDescription:
      "Supports text-based PDFs up to 10 MB, including password-protected files. Scanned/image PDFs are not supported yet.",
    featurePrivateTitle: "Private by default",
    featurePrivateBody:
      "Your PDF is never stored unless you sign in and opt in to history.",
    featureColumnsTitle: "Standard columns",
    featureColumnsBody:
      "Date, description, debit, credit, balance, and reference.",
    featureBanksTitle: "Thai banks",
    featureBanksBody: "Auto-detects SCB, KBank, and KTB with manual override.",
  },
  upload: {
    dropzone: "Drop your bank statement PDF here",
    dropzoneHint: "Digital PDFs from SCB, KBank, or KTB · Max 10 MB",
    bank: "Bank",
    autoDetect: "Auto-detect",
    downloadFormat: "Download format",
    formatCsv: "CSV",
    formatXlsx: "Excel (XLSX)",
    saveHistory:
      "Save to my history (30 days, transactions only — PDF is not stored)",
    preview: "Preview transactions",
    processing: "Processing…",
    download: "Download",
    errorPdf: "Please upload a PDF file.",
    errorChooseFile: "Choose a PDF file first.",
    errorConversion: "Conversion failed.",
    errorNetwork: "Network error. Please try again.",
    errorPasswordRequired: "Enter the PDF password to unlock this statement.",
    errorPasswordInvalid: "Incorrect password. Please try again.",
    pdfPassword: "PDF password",
    pdfPasswordHint: "Required for password-protected statements. Not stored.",
    bankLabel: "Bank",
    detectionConfidence: "detection confidence",
    account: "Account",
    period: "Period",
    transactions: "transactions",
  },
  preview: {
    date: "Date",
    description: "Description",
    debit: "Debit",
    credit: "Credit",
    balance: "Balance",
    showingRows: "Showing first {limit} of {total} rows. Download the full file to see all transactions.",
  },
  history: {
    title: "Conversion history",
    subtitle: "Stored for 30 days. PDFs are never saved.",
    unavailableTitle: "History unavailable",
    unavailableDescription:
      "Set DATABASE_URL and run migrations to enable conversion history.",
    empty:
      'No saved conversions yet. Convert a statement and check "Save to my history".',
    rows: "rows",
    expires: "expires",
    back: "← Back to converter",
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: May 2026",
    collectTitle: "What we collect",
    collectAnonymous:
      "When you convert a statement without signing in, we process your PDF in server memory only. We do not store the PDF file.",
    collectSignedIn:
      "If you sign in and choose to save history, we store the extracted transaction rows (not your PDF) for 30 days so you can re-download them.",
    notTitle: "What we do not do",
    notSell: "We do not sell your data.",
    notAds: "We do not use your statements for advertising.",
    notScanned: "We do not support scanned PDFs in the current version.",
    limitsTitle: "Rate limits",
    limitsBody: "Anonymous conversions are rate-limited per IP to prevent abuse.",
    contactTitle: "Contact",
    contactBody:
      "For privacy questions, contact the site operator through your deployment channel (e.g. GitHub issues on this project).",
  },
  terms: {
    title: "Terms of Use",
    updated: "Last updated: May 2026",
    serviceTitle: "Service",
    serviceBody:
      "This tool converts digital PDF bank statements from supported Thai banks into CSV or Excel format. Results depend on PDF layout; always verify exported data against your original statement.",
    warrantyTitle: "No warranty",
    warrantyBody:
      "The service is provided as-is. We are not responsible for accounting, tax, or financial decisions based on converted files.",
    useTitle: "Acceptable use",
    useBody:
      "Do not upload statements you are not authorized to process. Do not attempt to overload or abuse the service.",
  },
} as const;
