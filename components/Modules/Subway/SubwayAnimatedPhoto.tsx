"use client";
import { useEffect, useState } from "react";
import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Jacquard_12 } from "next/font/google";

const jacquard = Jacquard_12({ weight: "400", subsets: ["latin"] });

function SubwayAnimatedPhoto({ item }: { item: AnimatedPhotoProps }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      <motion.div
        style={{
          gridColumnStart: item.column || undefined,
          gridRowStart: item.row || undefined,
          gridColumnEnd: item.columnSpan
            ? `span ${item.columnSpan}`
            : undefined,
          gridRowEnd: item.rowSpan ? `span ${item.rowSpan}` : undefined,
        }}
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1 || 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: item.delay || 0 }}
        className={`relative flex items-end ${item.wrapperClassName || ""}`}
      >
        {item.label && (
          <p className="font-bold mt-1.5 w-full text-[10px] tracking-wide text-neutral-200 relative z-10">
            {item.label}
          </p>
        )}
        <div
          className={`w-full h-auto ${item.aspectRatio ? "overflow-hidden" : ""}`}
          style={
            item.aspectRatio ? { aspectRatio: item.aspectRatio } : undefined
          }
        >
          <Image
            style={{
              scale: isDesktop ? (item.scale ?? 1) : 1,
            }}
            src={item.src}
            alt={item.alt || ""}
            fill
            onClick={() => setModalOpen(true)}
            className={`cursor-pointer ${item.objectFit ? `object-${item.objectFit}` : "max-sm:object-cover object-contain"} ${item.className || ""}`}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="animated-photo-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 cursor-zoom-out"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-[90vw] h-[85dvh] max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={item.src}
                alt={item.alt || ""}
                fill
                className="object-contain p-4"
              />
            </motion.div>
            <button
              onClick={() => setModalOpen(false)}
              className={`${jacquard.className} absolute top-5 right-5 text-white/70 hover:text-white text-3xl leading-none z-10 cursor-pointer`}
            >
              X
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default SubwayAnimatedPhoto;
