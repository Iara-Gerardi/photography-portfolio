"use client";
import {
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
} from "react";
import { Jacquard_12 } from "next/font/google";
import PhotoSphere from "@/components/Carousel3D/PhotoSphere";
import { sphereImages } from "./hero-images";
import Sections from "@/components/Modules/Sections";

const jacquard24 = Jacquard_12({
  weight: "400",
  subsets: ["latin"],
});

export default function page() {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const accumulatedScrollRef = useRef(0);
  //TO-DO: Add loader
  const [sphereLoaded, setSphereLoaded] = useState(false);
  const [sphereProgress, setSphereProgress] = useState(0);
  const [circleProgress, setCircleProgress] = useState(0);
  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Shared flag: when Sections is at section 0 and the user scrolls up,
  // Sections sets this to true and goes silent. The hero wheel handler then
  // takes over and naturally decrements the accumulator (reverse animation).
  // Once the user scrolls forward past the sections threshold again, the hero
  // handler resets this to false so Sections reactivates.
  const isScrollingBackRef = useRef(false);
  const sectionsActiveRef = useRef(false);

  // Track viewport size for pixel grid — only runs on client, preventing SSR mismatch
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Compute pixel grid at component level (hooks cannot be used inside JSX)
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
        const effectiveDistance =
          normalizedDistance * (1 - spikeReach * spikeShape);

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

  // Scroll to top BEFORE paint using useLayoutEffect
  // Also disable browser scroll restoration
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      // Prevent browser from restoring previous scroll position
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";

      window.scrollTo(0, 0);
    }
  }, []);

  // Scroll-jacking: capture wheel events to drive animation instead of scrolling
  useEffect(() => {
    const sphereThreshold = 800; // Virtual scroll for sphere animation
    const circleThreshold = 600; // Virtual scroll for circle animation (faster)
    const holdThreshold = 400; // Hold time where layout is fully visible
    const totalThreshold = sphereThreshold + circleThreshold + holdThreshold;

    const handleWheel = (e: WheelEvent) => {
      // Check if we're at the hero section
      if (!heroContainerRef.current) return;
      const rect = heroContainerRef.current.getBoundingClientRect();

      // Only capture scroll when hero is visible (top of hero near viewport top)
      const heroVisible = rect.top > -50 && rect.top < 50;

      if (!heroVisible) return; // Allow normal scrolling when not at hero

      // All animations complete and scrolling down - allow normal scroll
      if (accumulatedScrollRef.current >= totalThreshold && e.deltaY > 0) {
        return;
      }

      // Sections territory: accumulator >= sectionsThreshold means circleProgress = 1.
      const sectionsThreshold = sphereThreshold - 200 + circleThreshold;

      // If Sections flagged "scrolling back", hero takes over upward scrolls.
      // If user reverses to scroll DOWN while still above threshold, re-enable Sections.
      if (isScrollingBackRef.current) {
        if (e.deltaY > 0 && accumulatedScrollRef.current >= sectionsThreshold) {
          isScrollingBackRef.current = false;
          return; // Sections reactivated — let it process this event
        }
        // Otherwise fall through and let hero handler process the scroll
      } else if (
        accumulatedScrollRef.current >= sectionsThreshold &&
        e.deltaY < 0
      ) {
        // Sections is active and handling navigation — don't interfere
        return;
      }

      // Animation at start and scrolling up - allow normal scroll (if there's content above)
      if (accumulatedScrollRef.current <= 0 && e.deltaY < 0) {
        return;
      }

      // Capture the scroll event for animation
      e.preventDefault();

      // Accumulate scroll delta (allow both directions)
      accumulatedScrollRef.current += e.deltaY;
      accumulatedScrollRef.current = Math.max(
        0,
        Math.min(totalThreshold, accumulatedScrollRef.current),
      );

      // Calculate sphere progress (0-1, from 0-sphereThreshold)
      const sphereProgress = Math.min(
        1,
        accumulatedScrollRef.current / sphereThreshold,
      );
      scrollProgressRef.current = sphereProgress;
      setSphereProgress(sphereProgress);

      // Calculate circle progress (0-1, from sphereThreshold to sphereThreshold + circleThreshold)
      // Stays at 1 during hold phase
      // Add + 200 to overlap the circle animation slightly with the end of the sphere animation for smoother transition
      const circleProgressValue = Math.min(
        1,
        Math.max(
          0,
          (accumulatedScrollRef.current - sphereThreshold + 200) /
            circleThreshold,
        ),
      );
      setCircleProgress(circleProgressValue);
      sectionsActiveRef.current = circleProgressValue >= 1;
    };

    // Touch handling for mobile
    let touchStartY = 0;
    let touchStartedOnSphere = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      // Check if the touch started on the sphere canvas (sphere is visible when not in sections)
      const target = e.target as HTMLElement;
      const sectionsThresholdForTouch = sphereThreshold - 200 + circleThreshold;
      touchStartedOnSphere =
        target.tagName === "CANVAS" &&
        accumulatedScrollRef.current < sectionsThresholdForTouch;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If touch started on sphere canvas, let the sphere handle it (rotation)
      if (touchStartedOnSphere) return;

      if (!heroContainerRef.current) return;

      const rect = heroContainerRef.current.getBoundingClientRect();
      const heroVisible = rect.top > -50 && rect.top < 50;

      if (!heroVisible) return;

      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;

      // Sections territory: accumulator >= sectionsThreshold means circleProgress = 1.
      const sectionsThreshold = sphereThreshold - 200 + circleThreshold;

      // If Sections flagged "scrolling back", hero takes over upward scrolls.
      if (isScrollingBackRef.current) {
        if (deltaY > 0 && accumulatedScrollRef.current >= sectionsThreshold) {
          isScrollingBackRef.current = false;
          return;
        }
      } else if (
        accumulatedScrollRef.current >= sectionsThreshold &&
        deltaY < 0
      ) {
        // Sections is active and handling navigation — don't interfere
        return;
      }

      // Also pass forward scrolls to Sections when we're in sections territory
      if (
        accumulatedScrollRef.current >= sectionsThreshold &&
        deltaY > 0 &&
        !isScrollingBackRef.current
      ) {
        return;
      }

      if (accumulatedScrollRef.current >= totalThreshold && deltaY > 0) return;
      if (accumulatedScrollRef.current <= 0 && deltaY < 0) return;

      e.preventDefault();

      accumulatedScrollRef.current += deltaY * 2;
      accumulatedScrollRef.current = Math.max(
        0,
        Math.min(totalThreshold, accumulatedScrollRef.current),
      );

      const sphereProgress = Math.min(
        1,
        accumulatedScrollRef.current / sphereThreshold,
      );
      scrollProgressRef.current = sphereProgress;
      setSphereProgress(sphereProgress);

      const circleProgressValue = Math.min(
        1,
        Math.max(
          0,
          (accumulatedScrollRef.current - sphereThreshold) / circleThreshold,
        ),
      );
      setCircleProgress(circleProgressValue);
      sectionsActiveRef.current = circleProgressValue >= 1;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Callback when scroll starts - close any open windows
  const handleScrollStart = useCallback(() => {
    // Windows will be closed by the component itself
  }, []);

  // Callback when sphere images finish loading
  const handleSphereLoadComplete = useCallback(() => {
    setSphereLoaded(true);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-dvh bg-black overflow-x-hidden">
      {/* Hero section - scroll-jacked until both animations complete */}
      <div
        ref={heroContainerRef}
        className="relative w-full h-dvh overflow-hidden"
      >
        {/* PhotoSphere layer — fades out as pixel grid expands */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: circleProgress > 0 ? 1 - circleProgress : 1,
            pointerEvents: circleProgress >= 1 ? "none" : "auto",
            zIndex: 20,
          }}
        >
          <div className="relative w-full h-full hero cursor-help flex items-center justify-center">
            <p
              className={`${jacquard24.className} text-slate-400 absolute bottom-5 md:right-10 z-50 text-8xl cursor-help hover:text-white max-md:text-3xl`}
              style={{ opacity: Math.max(0, 1 - sphereProgress / 0.5) }}
            >
              ocrequemado
            </p>
            <PhotoSphere
              height={700}
              width={1550}
              mobileWidth={400}
              mobileCameraDistance={19}
              cameraDistance={13}
              lineOpacity={0.4}
              flatness={0}
              imageSize={4}
              className="cursor-help flex items-center justify-center"
              scrollProgressRef={scrollProgressRef}
              onScrollStart={handleScrollStart}
              onLoadComplete={handleSphereLoadComplete}
              images={sphereImages}
              ditherInitialPixelSize={2}
              ditherFinalPixelSize={15}
              ditherPaletteSize={100}
              ditherStrength={0.5}
            />
          </div>
        </div>

        {/* Pixelated expansion — sparkle cells grow over the photosphere */}
        {pixelGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 25 }}
          >
            {pixelGrid}
          </div>
        )}

        {/* Sections — visible once pixel fill completes, hidden while animating back */}
        <div
          className="absolute inset-0"
          style={{
            opacity: circleProgress >= 1 ? 1 : 0,
            pointerEvents: circleProgress >= 1 ? "auto" : "none",
            zIndex: circleProgress >= 1 ? 30 : 0,
          }}
        >
          <Sections isScrollingBackRef={isScrollingBackRef} isActiveRef={sectionsActiveRef} />
        </div>
      </div>
    </div>
  );
}
