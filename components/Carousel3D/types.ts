import { MutableRefObject } from "react";

export interface SphereImage {
  /** Image URL */
  src: string;
  /** Collection name — images sharing the same collection are connected by a line */
  collection?: string;
}

export interface PhotoWindow {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  zIndex: number;
  width: number;
  height: number;
}

export interface PhotoSphereProps {
  /** Array of images to place on the sphere */
  images: SphereImage[];
  /** Color of the collection connection lines */
  lineColor?: string;
  /** Opacity of the collection connection lines */
  lineOpacity?: number;
  /** Base size of images on the sphere */
  imageSize?: number;
  /** How flat/parallel to screen the images are (0 = fully wrapped around sphere, 1 = parallel to screen) */
  flatness?: number;
  /** Sphere radius */
  radius?: number;
  /** Auto-rotation speed */
  autoRotateSpeed?: number;
  /** Enable mouse control */
  enableMouseControl?: boolean;
  /** Camera distance */
  cameraDistance?: number;
  /** Camera distance on mobile devices */
  mobileCameraDistance?: number;
  /** Canvas height */
  height?: number;
  /** Canvas width */
  width?: number;
  /** Canvas width on mobile devices */
  mobileWidth?: number;
  /** Window positioning style: 'random' or 'diagonal' */
  windowPositioning?: "random" | "diagonal";
  /** Additional CSS class */
  className?: string;
  /** Ref for scroll progress (0-1) - updated externally, read in animation loop to avoid re-renders */
  scrollProgressRef?: MutableRefObject<number>;
  /** Callback when scroll starts (to notify parent to close windows) */
  onScrollStart?: () => void;
  /** Callback when all images have finished loading */
  onLoadComplete?: () => void;
  /** Ref that disables sphere touch/mouse interaction when true (mobile scroll lock) */
  interactionDisabledRef?: MutableRefObject<boolean>;
  /** Initial pixel size for dithering at scroll=0 (1 = full res). Omit to disable dithering. */
  ditherInitialPixelSize?: number;
  /** Final pixel size for dithering at scroll=1 (higher = more pixelated) */
  ditherFinalPixelSize?: number;
  /** Color quantization levels per channel (default: 4, higher = more colors) */
  ditherPaletteSize?: number;
  /** Dither noise strength 0-1 (default: 1.0, controls blue-noise offset amount) */
  ditherStrength?: number;
}
