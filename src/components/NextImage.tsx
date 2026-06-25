import type { CSSProperties, ImgHTMLAttributes } from "react";

type ImageProps = {
  src: string;
  alt: string;
  /** next/image compat: absolutely fill the (relative) parent. */
  fill?: boolean;
  /** next/image compat: ignored (no optimizer). Kept to avoid breaking call sites. */
  sizes?: string;
  priority?: boolean;
  placeholder?: "empty" | "blur";
  blurDataURL?: string;
  quality?: number;
  unoptimized?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  loading?: "lazy" | "eager";
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading">;

/**
 * Drop-in replacement for next/image that renders a plain <img>.
 * No image optimization / loader. `fill` is implemented with absolute
 * positioning so existing layouts keep working.
 */
export function Image({
  fill,
  sizes: _sizes,
  priority,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  quality: _quality,
  unoptimized: _unoptimized,
  className,
  style,
  loading,
  width,
  height,
  ...rest
}: ImageProps) {
  const fillStyle: CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : {};

  return (
    <img
      {...rest}
      className={className}
      style={{ ...fillStyle, ...style }}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding="async"
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
    />
  );
}

export default Image;
