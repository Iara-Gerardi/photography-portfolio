"use client";
import { useEffect, useState } from "react";
import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";
import Image from "next/image";
import { motion } from "framer-motion";
function SubwayAnimatedPhoto({ item }: { item: AnimatedPhotoProps }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <motion.div
      style={{
        gridColumnStart: item.column || undefined,
        gridRowStart: item.row || undefined,
        gridColumnEnd: item.columnSpan ? `span ${item.columnSpan}` : undefined,
        gridRowEnd: item.rowSpan ? `span ${item.rowSpan}` : undefined,
      }}
      initial={{ scale: 0.6, opacity: 0 }}
      whileInView={{ scale: 1 || 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: item.delay || 0 }}
      className={`relative flex items-end ${item.wrapperClassName || ""}`}
    >
      {item.label && (
        <p className="font-bold mt-1.5 w-full text-[10px] tracking-wide text-neutral-200">
          {item.label}
        </p>
      )}
      <div
        className={`w-full h-auto ${item.aspectRatio ? "overflow-hidden" : ""}`}
        style={item.aspectRatio ? { aspectRatio: item.aspectRatio } : undefined}
      >
        <Image
          style={{
            scale: isDesktop ? (item.scale ?? 1) : 1,
          }}
          src={item.src}
          alt={item.alt || ""}
          fill
          className={`${item.objectFit ? `object-${item.objectFit}` : "max-sm:object-cover object-contain"} ${item.className || ""}`}
        />
      </div>
    </motion.div>
  );
}

export default SubwayAnimatedPhoto;
