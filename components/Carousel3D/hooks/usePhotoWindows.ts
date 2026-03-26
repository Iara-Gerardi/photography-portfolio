import { useCallback, useRef, useState, RefObject } from "react";
import { PhotoWindow } from "../types";

interface UsePhotoWindowsOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  windowPositioning: "random" | "diagonal";
}

export function usePhotoWindows({
  containerRef,
  windowPositioning,
}: UsePhotoWindowsOptions) {
  const [windows, setWindows] = useState<PhotoWindow[]>([]);
  const nextZIndexRef = useRef(1000);
  const diagonalOffsetRef = useRef({ x: 0, y: 0 });

  const openWindow = useCallback(
    (imageUrl: string) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const targetArea = 200000;

        let windowWidth: number;
        let windowHeight: number;

        if (aspectRatio > 1) {
          windowHeight = Math.sqrt(targetArea / aspectRatio);
          windowWidth = windowHeight * aspectRatio;
        } else {
          windowWidth = Math.sqrt(targetArea * aspectRatio);
          windowHeight = windowWidth / aspectRatio;
        }

        windowWidth = Math.round(windowWidth);
        windowHeight = Math.round(windowHeight);

        const isMobileDevice = window.innerWidth < 768;
        if (isMobileDevice) {
          windowWidth = Math.round(windowWidth * 0.6);
          windowHeight = Math.round(windowHeight * 0.6);
        }

        let x: number;
        let y: number;

        if (windowPositioning === "diagonal") {
          x = diagonalOffsetRef.current.x;
          y = diagonalOffsetRef.current.y;

          diagonalOffsetRef.current.x += 30;
          diagonalOffsetRef.current.y += 30;

          if (
            diagonalOffsetRef.current.x + windowWidth > containerRect.width ||
            diagonalOffsetRef.current.y + windowHeight > containerRect.height
          ) {
            diagonalOffsetRef.current = { x: 0, y: 0 };
          }
        } else {
          x = Math.random() * Math.max(0, containerRect.width - windowWidth);
          y = Math.random() * Math.max(0, containerRect.height - windowHeight);
        }

        const zIndex = nextZIndexRef.current++;
        const newWindow: PhotoWindow = {
          id: `window-${Date.now()}-${Math.random()}`,
          imageUrl,
          x,
          y,
          zIndex,
          width: windowWidth,
          height: windowHeight,
        };

        setWindows((prev) => [...prev, newWindow]);
      };
    },
    [containerRef, windowPositioning],
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const bringToFront = useCallback((id: string) => {
    const zIndex = nextZIndexRef.current++;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex } : w)));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const closeAllWindows = useCallback(() => {
    setWindows((prev) => (prev.length > 0 ? [] : prev));
  }, []);

  return { windows, openWindow, closeWindow, bringToFront, moveWindow, closeAllWindows };
}
