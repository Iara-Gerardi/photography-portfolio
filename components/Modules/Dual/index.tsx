"use client";
import React from "react";
import dark01 from "./photos/02.jpg";
import dark02 from "./photos/03.png";
import light01 from "./photos/04.jpg";
import light02 from "./photos/05.jpg";
import light03 from "./photos/06.jpg";
import light04 from "./photos/07.jpg";
import bg from "./photos/bg.jpg";
import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";
import AnimatedPhoto from "@/components/AnimatedPhoto";
import { techHeartPattern } from "@/components/Island/patterns/techHeart";
import BorderIsland from "@/components/Island/BorderIsland";
import { motion } from "framer-motion";
const DUAL_IMAGES: AnimatedPhotoProps[] = [
  {
    src: light01,
    delay: 0.2,
    label: "( 01 )",  
    mobileObjectFit: "cover",
  },
  {
    src: dark01,
    delay: 0.3,
    label: "( 02 )",
    mobileObjectFit: "cover",
  },
  {
    src: light02,
    delay: 0.4,
    label: "( 03 )",
    mobileObjectFit: "cover",
  },
  {
    src: light03,
    wrapperClassName: "[grid-row:3] md:[grid-row:auto]",
    delay: 0.5,
    label: "( 04 )",
    mobileObjectFit: "cover",
  },
  {
    src: dark02,
    wrapperClassName: "[grid-row:3] md:[grid-row:auto]",
    delay: 0.6,
    label: "( 05 )",
    mobileObjectFit: "cover",
  },
  {
    src: light04,
    wrapperClassName: "[grid-row:3] md:[grid-row:auto]",
    delay: 0.7,
    label: "( 06 )",
    mobileObjectFit: "cover",
  },
  {
    src: bg,
    objectFit: "cover",
    wrapperClassName:
      "w-full [grid-column:1/span_3] [grid-row:2] md:[grid-row:auto] md:[grid-column:1/span_6]",
    delay: 1,
  },
];

function Dual() {
  return (
    <div className="bg-slate-400 h-screen relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.3, opacity: 0, position: "absolute", inset: 0, zIndex: 10 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 1.6 }}
      >
        <BorderIsland
          bitmap={techHeartPattern.filter((i) => i.includes(1))}
          colors={["white"]}
          className="absolute z-10 inset-0 opacity-30 md:-bottom-56"
          squareSize="size-[2.3px] md:size-1"
        />
      </motion.div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-6 max-sm:py-4 pt-4 justify-between h-screen grid-rows-3 md:grid-rows-[1fr_2.3fr] !justify-items-center">
        {DUAL_IMAGES.map((item, i) => (
          <AnimatedPhoto key={`dual-image-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default Dual;
