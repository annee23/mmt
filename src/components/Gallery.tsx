"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { dimsOf } from "@/components/Photo";

type Props = { images: string[]; alt: string; labels: { open: string; prev: string; next: string; close: string } };

/** Masonry gallery with a keyboard-accessible lightbox. */
export function Gallery({ images, alt, labels }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    dialog.current?.close();
    setIndex(null);
    trigger.current?.focus();
  }, []);
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (index !== null && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index === null ? null : images[index];
  const [cw, ch] = current ? dimsOf(current) : [4, 3];

  return (
    <>
      <ul className="columns-2 gap-3 md:columns-3 md:gap-5 lg:columns-4">
        {images.map((src, i) => {
          const [w, h] = dimsOf(src);
          return (
            <li key={src} className="mb-3 break-inside-avoid md:mb-5">
              <button
                type="button"
                className="film block w-full cursor-zoom-in"
                aria-label={`${labels.open} ${i + 1} / ${images.length}`}
                onClick={(e) => {
                  trigger.current = e.currentTarget;
                  setIndex(i);
                }}
              >
                <Image
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  width={w}
                  height={h}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  quality={60}
                  loading={i < 4 ? "eager" : "lazy"}
                  className="block h-auto w-full"
                />
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === dialog.current && close()}
        aria-label={alt}
        className="m-0 h-screen max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-brown/92"
      >
        {current && (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-10" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="film film--plain relative max-h-[82vh] max-w-full">
              <Image
                src={current}
                alt={`${alt} ${index! + 1}`}
                width={cw}
                height={ch}
                sizes="100vw"
                quality={85}
                className="block max-h-[82vh] w-auto max-w-full object-contain"
              />
            </div>
            <p className="font-title mt-4 text-paper/80">
              {index! + 1} / {images.length}
            </p>
            <div className="mt-3 flex gap-3">
              <button type="button" className="btn btn-sm btn-light" onClick={() => step(-1)} aria-label={labels.prev}>
                ←
              </button>
              <button type="button" className="btn btn-sm btn-light" onClick={close} aria-label={labels.close}>
                {labels.close}
              </button>
              <button type="button" className="btn btn-sm btn-light" onClick={() => step(1)} aria-label={labels.next}>
                →
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
