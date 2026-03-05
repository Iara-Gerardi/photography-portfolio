"use client";
import Dollhouse from "@/components/Modules/Dollhouse";
import Dual from "@/components/Modules/Dual";
import Street from "@/components/Modules/Street";
import Subway from "@/components/Modules/Subway";
import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SocialMedia from "@/components/Modules/SocialMedia";

const SECTIONS = [
  { key: "dual", bg: "#94a3b8", component: <Dual /> },
  { key: "street", bg: "#000000", component: <Street /> },
  { key: "dollhouse", bg: "#94a3b8", component: <Dollhouse /> },
  { key: "subway", bg: "#000000", component: <Subway /> },
];

function Sections({
  isScrollingBackRef,
}: {
  isScrollingBackRef?: React.MutableRefObject<boolean>;
}) {
  const [current, setCurrent] = useState(0);
  const [showSections, setShowSections] = useState(true);
  const lastScrollTime = useRef(0);
  const currentRef = useRef(0);
  const showSectionsRef = useRef(true);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    showSectionsRef.current = showSections;
  }, [showSections]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // While hero is animating the scroll-back, Sections goes silent
      if (isScrollingBackRef?.current) return;

      const now = Date.now();
      if (now - lastScrollTime.current < 700) return;

      if (!showSectionsRef.current) {
        // In the bottom section — scroll up returns to sections
        if (e.deltaY < 0) {
          lastScrollTime.current = now;
          setShowSections(true);
        }
        return;
      }

      if (e.deltaY > 0) {
        if (currentRef.current === SECTIONS.length - 1) {
          // At last section — scroll down reveals bottom content
          lastScrollTime.current = now;
          setShowSections(false);
        } else {
          lastScrollTime.current = now;
          setCurrent((c) => Math.min(c + 1, SECTIONS.length - 1));
        }
      } else if (e.deltaY < 0) {
        if (currentRef.current === 0 && showSectionsRef.current) {
          // Signal hero to take over upward scrolling
          if (isScrollingBackRef) {
            isScrollingBackRef.current = true;
          }
          return;
        }
        lastScrollTime.current = now;
        setCurrent((c) => Math.max(c - 1, 0));
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {showSections ? (
        <motion.div
          key="sections"
          className="relative w-full h-screen overflow-hidden"
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={SECTIONS[current].key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {SECTIONS[current].component}
            </motion.div>
          </AnimatePresence>

          {/* Glyph navigation */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
            {SECTIONS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setCurrent(i)}
                className="leading-none transition-all duration-300 select-none"
                style={{
                  color: "white",
                  opacity: i === current ? 1 : 0.35,
                  fontSize: i === current ? "14px" : "10px",
                  transform: i === current ? "scale(1.2)" : "scale(1)",
                }}
              >
                ✦
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <SocialMedia />
      )}
    </AnimatePresence>
  );
}

export default Sections;
