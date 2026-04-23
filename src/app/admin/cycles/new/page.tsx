import { CycleForm } from "../_form";
import { createCycle } from "@/lib/cycle-actions";

export default function NewCyclePage() {
  return (
    <div className="container-max py-16 max-w-4xl">
      <div className="eyebrow mb-4">New cycle</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-10">
        Create investment cycle
      </h1>
      <CycleForm action={createCycle} submitLabel="Create cycle" />
    </div>
  );
}
