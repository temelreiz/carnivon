// Mock data shapes. Replace with Prisma queries once DB is wired.

export type Product = {
  name: string;
  symbol: string;
  duration_days: number;
  target_return: string;
  status: "Open" | "Funding" | "Active" | "Closed" | "Matured";
  aum: string;
  deployed: string;
  min_ticket: string;
  start_date: string;
  maturity_date: string;
};

export type LiveMetrics = {
  total_headcount: number;
  avg_entry_weight: string;
  mortality_rate: string;
  days_in_cycle: number;
  deployment_ratio: string;
  expected_exit: string;
};

export type DocumentLink = {
  title: string;
  type: "term_sheet" | "subscription" | "risk" | "valuation" | "audit" | "traceability";
  version: string;
  updated_at: string;
  // href omitted in mock — backend will sign URLs on demand
};

export const mockProduct: Product = {
  name: "Carnivon Brazil Cattle Cycle 01",
  symbol: "CVC01",
  duration_days: 90,
  target_return: "10–16% (annualized target)",
  status: "Open",
  aum: "$1,200,000",
  deployed: "35%",
  min_ticket: "1 head",
  start_date: "2026-06-01",
  maturity_date: "2026-08-30",
};

export const mockMetrics: LiveMetrics = {
  total_headcount: 420,
  avg_entry_weight: "385kg",
  mortality_rate: "1.2%",
  days_in_cycle: 47,
  deployment_ratio: "62%",
  expected_exit: "Oct 2026",
};

export const mockDocuments: DocumentLink[] = [
  { title: "Term Sheet", type: "term_sheet", version: "v1.2", updated_at: "2026-03-18" },
  { title: "Subscription Agreement", type: "subscription", version: "v1.0", updated_at: "2026-03-01" },
  { title: "Risk Disclosure", type: "risk", version: "v1.1", updated_at: "2026-03-10" },
  { title: "Valuation Policy", type: "valuation", version: "v1.0", updated_at: "2026-02-22" },
];
