/**
 * Seed the production-shaped data we use on the landing page and APIs:
 *   - One Cycle (CVC01) in FUNDING state
 *   - Latest MetricsSnapshot
 *   - The 4 launch Documents
 *
 * Run with:   pnpm tsx prisma/seed.ts
 */
import { PrismaClient, CycleStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cycle = await prisma.cycle.upsert({
    where: { symbol: "CVC01" },
    update: {},
    create: {
      symbol: "CVC01",
      name: "Carnivon Brazil Cattle Cycle 01",
      status: CycleStatus.FUNDING,
      durationDays: 150,
      startDate: new Date("2026-06-01"),
      maturityDate: new Date("2026-10-29"),
      targetReturn: "10–16% (annualized target)",
      minTicket: 5_000_000, // $50,000 in cents
      aumCents: BigInt(120_000_000), // $1,200,000
      deployedPct: 35,
      spvEntity: "Carnivon SPC Ltd",
      operator: "Carnivon Brazil Ltda",
    },
  });

  // Replace the snapshot rather than appending, so there's one latest row.
  await prisma.metricsSnapshot.deleteMany({ where: { cycleId: cycle.id } });
  await prisma.metricsSnapshot.create({
    data: {
      cycleId: cycle.id,
      totalHeadcount: 420,
      avgEntryWeightKg: 385,
      mortalityPctBp: 120, // 1.20%
      daysInCycle: 47,
      deploymentPctBp: 6200, // 62.00%
      expectedExit: "Oct 2026",
    },
  });

  const docs = [
    { title: "Term Sheet", kind: "term_sheet", version: "v1.2", storageKey: "docs/cvc01/term-sheet-v1.2.pdf" },
    { title: "Subscription Agreement", kind: "subscription", version: "v1.0", storageKey: "docs/cvc01/subscription-v1.0.pdf" },
    { title: "Risk Disclosure", kind: "risk", version: "v1.1", storageKey: "docs/cvc01/risk-v1.1.pdf" },
    { title: "Valuation Policy", kind: "valuation", version: "v1.0", storageKey: "docs/cvc01/valuation-v1.0.pdf" },
  ];

  for (const d of docs) {
    await prisma.document.upsert({
      where: { id: `${d.kind}-${d.version}` }, // composite-ish id for idempotency
      update: { ...d, cycleSymbol: "CVC01" },
      create: { id: `${d.kind}-${d.version}`, ...d, cycleSymbol: "CVC01" },
    });
  }

  console.log("Seeded CVC01 cycle, metrics snapshot, and 4 documents.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
