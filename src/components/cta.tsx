import { Button } from "@/components/ui/button.tsx";

export function Cta({
  title,
  buttonLabel,
}: {
  title: string;
  buttonLabel: string;
}) {
  return (
    <section className="bg-[#2d6b5e] text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <Button size="lg" className="rounded-full px-7 font-semibold bg-green-300 text-green-900 shadow-none">
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}
