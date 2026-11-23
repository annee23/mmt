import Image from "next/image";
import dims from "@/content/image-dims.json";

const DIMS = dims as unknown as Record<string, [number, number]>;
export const dimsOf = (src: string): [number, number] => DIMS[src] ?? [1600, 1200];

type Props = {
  src: string;
  alt: string;
  /** Crop to a fixed aspect ratio (e.g. "4/5"). Omit to keep the photo's natural proportions. */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  position?: string;
  plain?: boolean;
  contain?: boolean;
};

/** Every photograph passes through here so the warm film treatment stays consistent. */
export function Photo({ src, alt, ratio, sizes = "(min-width: 1024px) 50vw, 100vw", priority, className = "", position, plain, contain }: Props) {
  const cls = `film ${plain ? "film--plain" : ""} ${className}`;
  if (plain) {
    return (
      <div className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} sizes={sizes} className="block h-auto w-full" />
      </div>
    );
  }
  if (ratio) {
    return (
      <div className={cls} style={{ aspectRatio: ratio }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={75}
          className={contain ? "object-contain" : "object-cover"}
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    );
  }
  const [w, h] = dimsOf(src);
  return (
    <div className={cls}>
      <Image src={src} alt={alt} width={w} height={h} sizes={sizes} priority={priority} quality={75} className="block h-auto w-full" />
    </div>
  );
}
