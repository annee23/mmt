import Image from "next/image";
import dims from "@/content/image-dims.json";

const DIMS = dims as unknown as Record<string, [number, number]>;
export const dimsOf = (src: string): [number, number] => DIMS[src] ?? [1600, 1200];
export const displayImageSrc = (src: string): string =>
  src.startsWith("/images/") ? src.replace(/\.(?:jpe?g|png)$/i, ".webp") : src;

type Props = {
  src: string;
  alt: string;
  /** Crop to a fixed aspect ratio (e.g. "4/5"). Omit to keep the photo's natural proportions. */
  ratio?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  position?: string;
  plain?: boolean;
  contain?: boolean;
  imageClassName?: string;
};

/** Every photograph passes through here so the warm film treatment stays consistent. */
export function Photo({ src, alt, ratio, fill, sizes = "(min-width: 1024px) 50vw, 100vw", priority, className = "", position, plain, contain, imageClassName }: Props) {
  const cls = `film ${plain ? "film--plain" : ""} ${className}`;
  const imageSrc = displayImageSrc(src);
  const isStaticImage = src.startsWith("/images/");
  const [w, h] = dimsOf(src);
  if (ratio || fill) {
    return (
      <div className={cls} style={ratio ? { aspectRatio: ratio } : undefined}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isStaticImage}
          quality={75}
          className={imageClassName ?? (contain ? "object-contain" : "object-cover")}
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    );
  }
  if (plain) {
    return (
      <div className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={alt} width={w} height={h} loading={priority ? "eager" : "lazy"} decoding="async" sizes={sizes} className={imageClassName ?? "block h-auto w-full"} />
      </div>
    );
  }
  return (
    <div className={cls}>
      <Image src={imageSrc} alt={alt} width={w} height={h} sizes={sizes} priority={priority} unoptimized={isStaticImage} quality={75} className={imageClassName ?? "block h-auto w-full"} />
    </div>
  );
}
