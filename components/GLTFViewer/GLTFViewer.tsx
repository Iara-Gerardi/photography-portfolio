"use client";

import { useGLTFViewer } from "./hooks/useGLTFViewer";
import type { GLTFViewerProps } from "./types";

export default function GLTFViewer({
  modelPath,
  size = 400,
  rotationSpeed = 0.01,
  cameraDistance = 5,
}: GLTFViewerProps) {
  const { containerRef } = useGLTFViewer({ modelPath, size, rotationSpeed, cameraDistance });

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
