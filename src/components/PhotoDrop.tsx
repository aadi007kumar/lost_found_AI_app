"use client";

import { useRef, useState } from "react";

/** Shrinks a photo to max 1600px JPEG in the browser so uploads stay small and fast. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not read image"))), "image/jpeg", 0.85),
  );
}

export function PhotoDrop({ onChange }: { onChange: (photo: Blob | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That isn’t an image.");
    try {
      const small = await shrink(file);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(small));
      onChange(small);
    } catch {
      setError("Couldn’t read that image. Try a JPG or PNG.");
    }
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-line bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={preview} alt="Selected photo" className="max-h-72 w-full object-contain" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-3 right-3 rounded-lg border border-line bg-card px-3 py-1.5 text-sm transition-transform duration-150 active:scale-[0.97]"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-10 text-center transition-colors duration-150 ${
            dragging ? "border-accent bg-accent/5" : "border-line bg-card hover:border-muted/60"
          }`}
        >
          <span className="text-[15px]">Add a photo</span>
          <span className="text-sm text-muted">Drag it here or tap to choose</span>
        </button>
      )}
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
