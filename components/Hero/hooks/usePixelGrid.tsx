import { useEffect, useMemo, useState } from "react";

export function usePixelGrid(circleProgress: number) {
  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Track viewport size — only runs on client, preventing SSR mismatch
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const pixelGrid = useMemo(() => {
    if (!viewportSize || circleProgress <= 0) return null;

    const pixelSize = 13;
    const cols = Math.ceil(viewportSize.width / pixelSize);
    const rows = Math.ceil(viewportSize.height / pixelSize);
    const centerX = cols / 2;
    const centerY = rows / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

    const totalFrames = 42;
    const currentFrame = Math.floor(circleProgress * totalFrames);

    // Deterministic pseudo-random offset seeded by pixel position
    const getRandomOffset = (x: number, y: number) => {
      const seed = x * 1000 + y;
      return ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
    };

    const pixels = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dx = col - centerX;
        const dy = row - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedDistance = distance / maxDistance;

        // Sparkle shape: 4 cardinal spikes (N/S/E/W directions)
        // cos(2θ)^4 peaks at 0°/90°/180°/270° and is 0 on diagonal axes
        const theta = Math.atan2(dy, dx);
        const spikeShape = Math.pow(Math.abs(Math.cos(2 * theta)), 4);

        // Along spike directions, pixels appear much earlier (lower effective distance),
        // creating elongated arms. As the expansion widens, off-spike areas fill in
        // naturally, transitioning to a circle.
        const spikeReach = 0.7;
        const effectiveDistance = normalizedDistance * (1 - spikeReach * spikeShape);

        // Smaller randomness so the sparkle arms are crisp at the start
        const randomness = getRandomOffset(col, row) * 0.08;
        const threshold = Math.max(0, effectiveDistance + randomness);

        const pixelFrame = Math.floor(threshold * totalFrames);

        if (currentFrame >= pixelFrame) {
          const frameAge = currentFrame - pixelFrame;
          // Stage 0 (just appeared): small "x"
          // Stage 1-3: larger "X"
          // Stage 4+: filled slate-400 background, no text
          let cellText = "";
          let cellBg = "transparent";
          let cellFontSize = "10px";
          if (frameAge === 0) {
            cellText = "...";
            cellFontSize = "7px";
          } else if (frameAge <= 3) {
            cellText = ".✶";
            cellFontSize = "10px";
          } else {
            cellBg = "#94a3b8";
          }

          pixels.push(
            <div
              key={`${row}-${col}`}
              className="absolute flex items-center justify-center text-slate-400"
              style={{
                left: col * pixelSize,
                top: row * pixelSize,
                width: pixelSize,
                height: pixelSize,
                backgroundColor: cellBg,
                fontSize: cellFontSize,
              }}
            >
              {cellText}
            </div>,
          );
        }
      }
    }

    return pixels;
  }, [circleProgress, viewportSize]);

  return { pixelGrid, viewportSize };
}
