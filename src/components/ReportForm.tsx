"use client";

import { useActionState, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createReport, type ReportState } from "@/app/actions";
import { CATEGORIES, CITY_SUGGESTIONS, STATES } from "@/lib/constants";
import { Button } from "./Button";
import { PhotoDrop } from "./PhotoDrop";

const input =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] text-fg placeholder:text-muted/70 " +
  "transition-[border-color,box-shadow] duration-150 outline-none " +
  "focus:border-accent focus:ring-4 focus:ring-accent/15";

function Field({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

type Kind = "lost" | "found";

export function ReportForm({ today }: { today: string }) {
  const [state, dispatch, pending] = useActionState<ReportState, FormData>(createReport, {});

  // The URL (?type=) is the source of truth, so header links and the toggle always agree.
  const urlType: Kind = useSearchParams().get("type") === "found" ? "found" : "lost";
  const [type, setTypeState] = useState<Kind>(urlType);
  const [seenUrlType, setSeenUrlType] = useState<Kind>(urlType);
  if (urlType !== seenUrlType) {
    setSeenUrlType(urlType);
    setTypeState(urlType);
  }
  function setType(t: Kind) {
    setTypeState(t);
    window.history.replaceState(null, "", `?type=${t}`);
  }
  const photo = useRef<Blob | null>(null);
  const v = state.fields ?? {};

  return (
    <form
      action={(fd) => {
        if (photo.current) fd.set("photo", photo.current, "photo.jpg");
        dispatch(fd);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="type" value={type} />

      {/* Lost / Found toggle */}
      <div className="relative grid grid-cols-2 rounded-xl border border-line bg-soft p-1">
        {(["lost", "found"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`relative z-10 rounded-lg py-2.5 text-[15px] font-medium transition-colors duration-150 ${
              type === t ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {type === t && (
              <motion.span
                layoutId="type-pill"
                className="absolute inset-0 -z-10 rounded-lg border border-line bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            {t === "lost" ? "I lost something" : "I found something"}
          </button>
        ))}
      </div>

      <Field label="What is it?">
        <input name="title" required minLength={3} maxLength={80} defaultValue={v.title}
          placeholder="e.g. Black Samsung phone" className={input} />
      </Field>

      <Field label="Category">
        <select name="category" required defaultValue={v.category ?? ""} className={input}>
          <option value="" disabled>Choose a category</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Description" hint="Colour, brand, marks, what was inside. More detail means better matches.">
        <textarea name="description" required minLength={10} maxLength={1000} rows={4}
          defaultValue={v.description}
          placeholder="e.g. Samsung Galaxy S21, cracked top-left corner, blue cover with a sticker"
          className={`${input} resize-y`} />
      </Field>

      <Field label="Photo" optional hint="AI reads the photo too, which helps find matches.">
        <PhotoDrop onChange={(b) => (photo.current = b)} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="State">
          <select name="state" required defaultValue={v.state ?? ""} className={input}>
            <option value="" disabled>Choose a state</option>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="City">
          <input name="city" required list="cities" maxLength={60} defaultValue={v.city}
            placeholder="e.g. Pune" className={input} />
          <datalist id="cities">
            {CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Place or landmark" optional>
          <input name="place" maxLength={120} defaultValue={v.place}
            placeholder="e.g. FC Road bus stop" className={input} />
        </Field>
        <Field label={type === "lost" ? "Date you lost it" : "Date you found it"}>
          <input name="event_date" type="date" required max={today}
            defaultValue={v.event_date ?? today} className={input} />
        </Field>
      </div>

      <fieldset className="space-y-6 rounded-2xl border border-line bg-soft/60 p-5">
        <div>
          <h2 className="font-medium">Your contact</h2>
          <p className="mt-0.5 text-sm text-muted">Shown to people with a matching report, so they can reach you.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Name">
            <input name="contact_name" required minLength={2} maxLength={60}
              defaultValue={v.contact_name} autoComplete="name" className={input} />
          </Field>
          <Field label="Phone">
            <input name="contact_phone" required type="tel" inputMode="tel" maxLength={16}
              defaultValue={v.contact_phone} autoComplete="tel" placeholder="98765 43210"
              className={input} />
          </Field>
        </div>
        <Field label="Email" optional>
          <input name="contact_email" type="email" maxLength={120} defaultValue={v.contact_email}
            autoComplete="email" className={input} />
        </Field>
        <p className="text-xs text-muted">Don’t enter Aadhaar, PAN or card numbers anywhere in this form.</p>
      </fieldset>

      {state.error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm"
        >
          {state.error}
        </motion.p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving and finding matches…" : type === "lost" ? "Post lost report" : "Post found report"}
      </Button>
    </form>
  );
}
