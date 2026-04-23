import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CycleForm } from "../_form";
import { updateCycle, deleteCycle } from "@/lib/cycle-actions";

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cycle = await prisma.cycle.findUnique({ where: { id } });
  if (!cycle) notFound();

  const boundUpdate = updateCycle.bind(null, id);
  const boundDelete = deleteCycle.bind(null, id);

  return (
    <div className="container-max py-16 max-w-4xl">
      <div className="eyebrow mb-4">Cycle</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-10">
        {cycle.symbol} — {cycle.name}
      </h1>
      <CycleForm
        action={boundUpdate}
        onDelete={async () => {
          "use server";
          await boundDelete();
        }}
        cycle={cycle}
        submitLabel="Save changes"
      />
    </div>
  );
}
