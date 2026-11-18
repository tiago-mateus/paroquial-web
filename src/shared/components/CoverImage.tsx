import { useState } from "react";
import { classNames } from "../lib/classNames";

type Props = {
  src?: string | null;
  fallbackSrc?: string | null;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
  imageOpacity?: number;
};

export function CoverImage({ src, fallbackSrc, className, imageClassName, imageOpacity, overlayClassName = "bg-[linear-gradient(to_bottom,rgb(0_0_0/0.2),rgb(0_0_0/0.78))]" }: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const image = [src, fallbackSrc].find((source) => source && !failedSources.includes(source));
  return <div aria-hidden="true" className={classNames("pointer-events-none overflow-hidden", className)}>
    {image ? <img key={image} src={image} alt="" onError={() => setFailedSources((sources) => [...sources, image])} style={imageOpacity === undefined ? undefined : { opacity: imageOpacity }} className={classNames("block h-full w-full object-cover", imageClassName)} /> : <div className={classNames("h-full w-full bg-primary", imageClassName)} />}
    <div className={classNames("absolute inset-0", overlayClassName)} />
  </div>;
}
