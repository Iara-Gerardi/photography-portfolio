"use client";

import React from "react";
import { motion } from "framer-motion";
import DecorativeContainer from "../DecorativeContainer/DecorativeContainer";
import { PhotoWindow } from "./types";

interface PhotoWindowItemProps {
  photoWindow: PhotoWindow;
  onClose: (id: string) => void;
  onBringToFront: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  ditherInitialPixelSize?: number;
}

const PhotoWindowItem = ({
  photoWindow,
  onClose,
  onBringToFront,
  onMove,
  ditherInitialPixelSize,
}: PhotoWindowItemProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".draggable-header")) return;

    onBringToFront(photoWindow.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWindowX = photoWindow.x;
    const startWindowY = photoWindow.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onMove(
        photoWindow.id,
        startWindowX + moveEvent.clientX - startX,
        startWindowY + moveEvent.clientY - startY,
      );
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".draggable-header")) return;

    onBringToFront(photoWindow.id);
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startWindowX = photoWindow.x;
    const startWindowY = photoWindow.y;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      onMove(
        photoWindow.id,
        startWindowX + moveTouch.clientX - startX,
        startWindowY + moveTouch.clientY - startY,
      );
    };
    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <motion.div
      key={photoWindow.id}
      data-photo-window
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="absolute"
      style={{
        left: photoWindow.x,
        top: photoWindow.y,
        zIndex: photoWindow.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <DecorativeContainer
        mode="modal"
        title="Image Viewer"
        width={photoWindow.width}
        height={photoWindow.height}
        showActions={true}
        onClose={() => onClose(photoWindow.id)}
        onCancel={() => onClose(photoWindow.id)}
        onOk={() => onClose(photoWindow.id)}
      >
        {ditherInitialPixelSize && ditherInitialPixelSize > 1 ? (
          <div
            style={{
              width: photoWindow.width,
              height: photoWindow.height,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={photoWindow.imageUrl}
              alt="Opened"
              draggable={false}
              style={{
                display: "block",
                imageRendering: "pixelated",
                width: `${Math.round(photoWindow.width / ditherInitialPixelSize)}px`,
                height: `${Math.round(photoWindow.height / ditherInitialPixelSize)}px`,
                transform: `scale(${ditherInitialPixelSize})`,
                transformOrigin: "0 0",
              }}
            />
          </div>
        ) : (
          <img
            src={photoWindow.imageUrl}
            alt="Opened"
            className="w-full h-auto object-contain"
            draggable={false}
          />
        )}
      </DecorativeContainer>
    </motion.div>
  );
};

export default PhotoWindowItem;
