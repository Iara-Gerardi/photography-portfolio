import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";

const SPHERE_THRESHOLD = 800;
const CIRCLE_THRESHOLD = 600;
const HOLD_THRESHOLD = 400;
const TOTAL_THRESHOLD = SPHERE_THRESHOLD + CIRCLE_THRESHOLD + HOLD_THRESHOLD;
const CIRCLE_OVERLAP = 200;
const SECTIONS_THRESHOLD = SPHERE_THRESHOLD - CIRCLE_OVERLAP + CIRCLE_THRESHOLD;

export const MOBILE_DEAD_ZONE_HEIGHT = 150;
const MOBILE_SPHERE_LOCK_TOLERANCE = 100;

export type UseHeroScrollReturn = {
  heroContainerRef: RefObject<HTMLDivElement | null>;
  scrollProgressRef: MutableRefObject<number>;
  isScrollingBackRef: MutableRefObject<boolean>;
  sectionsActiveRef: MutableRefObject<boolean>;
  sphereInteractionDisabledRef: MutableRefObject<boolean>;
  sphereProgress: number;
  circleProgress: number;
  sphereLocked: boolean;
};

export function useHeroScroll(): UseHeroScrollReturn {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const accumulatedScrollRef = useRef(0);
  const isScrollingBackRef = useRef(false);
  const sectionsActiveRef = useRef(false);
  const sphereInteractionDisabledRef = useRef(false);

  const [sphereProgress, setSphereProgress] = useState(0);
  const [circleProgress, setCircleProgress] = useState(0);
  const [sphereLocked, setSphereLocked] = useState(false);

  // Disable browser scroll restoration and scroll to top before paint
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  // Scroll-jacking: capture wheel and touch events to drive animation
  useEffect(() => {
    const updateLock = (accumulated: number) => {
      if (window.innerWidth < 768) {
        const locked = accumulated >= MOBILE_SPHERE_LOCK_TOLERANCE;
        sphereInteractionDisabledRef.current = locked;
        setSphereLocked(locked);
      }
    };

    const updateProgress = (accumulated: number) => {
      const sp = Math.min(1, accumulated / SPHERE_THRESHOLD);
      scrollProgressRef.current = sp;
      setSphereProgress(sp);

      const cp = Math.min(
        1,
        Math.max(0, (accumulated - SPHERE_THRESHOLD + CIRCLE_OVERLAP) / CIRCLE_THRESHOLD),
      );
      setCircleProgress(cp);
      sectionsActiveRef.current = cp >= 1;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!heroContainerRef.current) return;
      const rect = heroContainerRef.current.getBoundingClientRect();
      if (rect.top <= -50 || rect.top >= 50) return;

      if (accumulatedScrollRef.current >= TOTAL_THRESHOLD && e.deltaY > 0) return;

      if (isScrollingBackRef.current) {
        if (e.deltaY > 0 && accumulatedScrollRef.current >= SECTIONS_THRESHOLD) {
          isScrollingBackRef.current = false;
          return;
        }
      } else if (accumulatedScrollRef.current >= SECTIONS_THRESHOLD && e.deltaY < 0) {
        return;
      }

      if (accumulatedScrollRef.current <= 0 && e.deltaY < 0) return;

      e.preventDefault();

      accumulatedScrollRef.current = Math.max(
        0,
        Math.min(TOTAL_THRESHOLD, accumulatedScrollRef.current + e.deltaY),
      );

      updateLock(accumulatedScrollRef.current);
      updateProgress(accumulatedScrollRef.current);
    };

    let touchStartY = 0;
    let touchStartedOnSphere = false;
    let touchStartedOnWindow = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      const target = e.target as HTMLElement;
      const isMobileDevice = window.innerWidth < 768;

      touchStartedOnWindow = !!target.closest("[data-photo-window]");

      if (isMobileDevice) {
        const vh = window.innerHeight;
        const inDeadZone =
          touchStartY < MOBILE_DEAD_ZONE_HEIGHT || touchStartY > vh - MOBILE_DEAD_ZONE_HEIGHT;
        const locked = accumulatedScrollRef.current >= MOBILE_SPHERE_LOCK_TOLERANCE;

        touchStartedOnSphere =
          target.tagName === "CANVAS" &&
          !inDeadZone &&
          !locked &&
          accumulatedScrollRef.current < SECTIONS_THRESHOLD;
      } else {
        touchStartedOnSphere =
          target.tagName === "CANVAS" &&
          accumulatedScrollRef.current < SECTIONS_THRESHOLD;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartedOnSphere || touchStartedOnWindow) return;
      if (!heroContainerRef.current) return;

      const rect = heroContainerRef.current.getBoundingClientRect();
      if (rect.top <= -50 || rect.top >= 50) return;

      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;

      if (!(accumulatedScrollRef.current <= 0 && deltaY < 0)) {
        e.preventDefault();
      }

      if (isScrollingBackRef.current) {
        if (deltaY > 0 && accumulatedScrollRef.current >= SECTIONS_THRESHOLD) {
          isScrollingBackRef.current = false;
          return;
        }
      } else if (accumulatedScrollRef.current >= SECTIONS_THRESHOLD && deltaY < 0) {
        return;
      }

      if (
        accumulatedScrollRef.current >= SECTIONS_THRESHOLD &&
        deltaY > 0 &&
        !isScrollingBackRef.current
      ) {
        return;
      }

      if (accumulatedScrollRef.current >= TOTAL_THRESHOLD && deltaY > 0) return;
      if (accumulatedScrollRef.current <= 0 && deltaY < 0) return;

      accumulatedScrollRef.current = Math.max(
        0,
        Math.min(TOTAL_THRESHOLD, accumulatedScrollRef.current + deltaY * 2),
      );

      updateLock(accumulatedScrollRef.current);
      updateProgress(accumulatedScrollRef.current);
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

  return {
    heroContainerRef,
    scrollProgressRef,
    isScrollingBackRef,
    sectionsActiveRef,
    sphereInteractionDisabledRef,
    sphereProgress,
    circleProgress,
    sphereLocked,
  };
}
