import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedPhotoProps } from "./types";
import { cn } from "@/lib/utils";

function AnimatedPhoto({ item }: { item: AnimatedPhotoProps }) {
  const wrapperStyle = {
    gridColumnStart: item.column || undefined,
    gridRowStart: item.row || undefined,
    gridColumnEnd: item.columnSpan ? `span ${item.columnSpan}` : undefined,
    gridRowEnd: item.rowSpan ? `span ${item.rowSpan}` : undefined,
  };

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut", delay: item.delay || 0 }}
      style={wrapperStyle}
      className={`relative flex items-end w-full h-full ${item.wrapperClassName}`}
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
          src={item.src}
          alt={item.alt || ""}
          fill
          className={cn(
            item.className,
            `${item.objectFit ? `object-${item.objectFit}` : `${!!item.mobileObjectFit ? `object-${item.mobileObjectFit}` : "object-contain"} sm:object-contain`}`,
          )}
        />
      </div>
    </motion.div>
  );
}

export default AnimatedPhoto;
