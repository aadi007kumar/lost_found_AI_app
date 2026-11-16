import { ButtonLink } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-3xl tracking-tight">We couldn’t find that report</h1>
      <p className="mt-2 text-muted">The link may be wrong or incomplete.</p>
      <ButtonLink href="/" variant="secondary" className="mt-8">Go home</ButtonLink>
    </div>
  );
}
