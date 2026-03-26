"use client";

import { Jacquard_12 } from "next/font/google";
import PhotoSphere from "@/components/Carousel3D/PhotoSphere";
import { sphereImages } from "@/app/hero-images";
import Sections from "@/components/Modules/Sections";
import { useHeroScroll, MOBILE_DEAD_ZONE_HEIGHT } from "./hooks/useHeroScroll";
import { usePixelGrid } from "./hooks/usePixelGrid";

// Variable made for testing
const MOBILE_DEAD_ZONE_OPACITY = 0;

const jacquard24 = Jacquard_12({
  weight: "400",
  subsets: ["latin"],
});

export default function Hero() {
  const {
    heroContainerRef,
    scrollProgressRef,
    isScrollingBackRef,
    sectionsActiveRef,
    sphereInteractionDisabledRef,
    sphereProgress,
    circleProgress,
    sphereLocked,
  } = useHeroScroll();

  const { pixelGrid, viewportSize } = usePixelGrid(circleProgress);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-dvh bg-black overflow-x-hidden">
      {/* Hero section - scroll-jacked until both animations complete */}
      <div
        ref={heroContainerRef}
        className="relative w-full h-dvh overflow-hidden"
      >
        <div
          className="absolute left-0 right-0 top-0 z-21 pointer-events-none md:hidden"
          style={{
            height: MOBILE_DEAD_ZONE_HEIGHT,
            backgroundColor: `rgba(107, 114, 128, ${MOBILE_DEAD_ZONE_OPACITY})`,
            opacity: circleProgress >= 1 ? 0 : 1,
          }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 z-21 pointer-events-none md:hidden"
          style={{
            height: MOBILE_DEAD_ZONE_HEIGHT,
            backgroundColor: `rgba(107, 114, 128, ${MOBILE_DEAD_ZONE_OPACITY})`,
            opacity: circleProgress >= 1 ? 0 : 1,
          }}
        />

        {/* PhotoSphere layer — fades out as pixel grid expands */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: circleProgress > 0 ? 1 - circleProgress : 1,
            pointerEvents:
              circleProgress >= 1 || (sphereLocked && viewportSize && viewportSize.width < 768)
                ? "none"
                : "auto",
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
              images={sphereImages}
              ditherInitialPixelSize={2}
              ditherFinalPixelSize={15}
              ditherPaletteSize={100}
              ditherStrength={0.5}
              interactionDisabledRef={sphereInteractionDisabledRef}
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
