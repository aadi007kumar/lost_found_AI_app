import { ButtonLink } from "@/components/Button";

const steps = [
  {
    title: "Tell us what happened",
    body: "Describe the item, add a photo if you have one, and say where and when.",
  },
  {
    title: "We look for matches",
    body: "AI compares your report with every opposite report across India by meaning, place and date.",
  },
  {
    title: "Reach out directly",
    body: "Each match shows the other person's contact. Come back to your report any time for new matches.",
  },
];

export default function Home() {
  return (
    <div className="py-14 sm:py-24">
      <section className="max-w-2xl">
        <p className="rise mb-4 text-sm text-muted">Lost &amp; found, across India</p>
        <h1 className="rise rise-1 font-serif text-4xl leading-[1.1] tracking-tight sm:text-6xl">
          Lost something? Someone may have found it.
        </h1>
        <p className="rise rise-2 mt-5 max-w-xl text-lg text-muted">
          Post what you lost or found. We match it with reports from people nearby, so the right
          things find their way home.
        </p>
        <div className="rise rise-3 mt-9 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/report?type=lost">I lost something</ButtonLink>
          <ButtonLink href="/report?type=found" variant="secondary">
            I found something
          </ButtonLink>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="font-serif text-2xl tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-card p-6">
              <span className="font-serif text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-2 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
