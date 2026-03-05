import { StaticImageData } from "next/image";

export interface AnimatedPhotoProps {
  src: StaticImageData;
  alt?: string;
  label?: string;
  column?: number;
  row?: number;
  rowSpan?: number;
  columnSpan?: number;
  scale?: number;
  delay?: number;
  className?: string;
  wrapperClassName?: string;
  aspectRatio?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  mobileObjectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}