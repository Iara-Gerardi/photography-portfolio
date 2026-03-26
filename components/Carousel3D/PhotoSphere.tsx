"use client";

import React, { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { PhotoSphereProps } from "./types";
import { usePhotoWindows } from "./hooks/usePhotoWindows";
import { usePhotoSphere } from "./hooks/usePhotoSphere";
import PhotoWindowItem from "./PhotoWindowItem";

const PhotoSphere = ({
  images,
  lineColor = "#ffffff",
  lineOpacity = 0.4,
  imageSize = 1.2,
  flatness = 0,
  radius = 5,
  autoRotateSpeed = 0.001,
  enableMouseControl = true,
  cameraDistance = 8,
  mobileCameraDistance = 12,
  height = 600,
  width,
  mobileWidth,
  windowPositioning = "diagonal",
  className = "",
  scrollProgressRef,
  onScrollStart,
  onLoadComplete,
  interactionDisabledRef,
  ditherInitialPixelSize,
  ditherFinalPixelSize = 20,
  ditherPaletteSize = 4,
  ditherStrength = 1.0,
}: PhotoSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { windows, openWindow, closeWindow, bringToFront, moveWindow, closeAllWindows } =
    usePhotoWindows({ containerRef, windowPositioning });

  // Stable refs so the THREE.js animation loop never holds stale callbacks
  const openWindowRef = useRef(openWindow);
  openWindowRef.current = openWindow;
  const closeWindowsRef = useRef(closeAllWindows);
  closeWindowsRef.current = closeAllWindows;

  usePhotoSphere({
    canvasRef,
    containerRef,
    openWindowRef,
    closeWindowsRef,
    images,
    lineColor,
    lineOpacity,
    imageSize,
    flatness,
    radius,
    autoRotateSpeed,
    enableMouseControl,
    cameraDistance,
    mobileCameraDistance,
    height,
    width,
    mobileWidth,
    scrollProgressRef,
    onScrollStart,
    onLoadComplete,
    interactionDisabledRef,
    ditherInitialPixelSize,
    ditherFinalPixelSize,
    ditherPaletteSize,
    ditherStrength,
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ height, width, perspective: "800px" }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <AnimatePresence>
        {windows.map((photoWindow) => (
          <PhotoWindowItem
            key={photoWindow.id}
            photoWindow={photoWindow}
            onClose={closeWindow}
            onBringToFront={bringToFront}
            onMove={moveWindow}
            ditherInitialPixelSize={ditherInitialPixelSize}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PhotoSphere;
