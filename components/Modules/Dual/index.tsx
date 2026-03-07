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
import Lissajous from "@/components/Lissajous/Lissajous";

const lissajousConfig: React.ComponentProps<typeof Lissajous> = {
  color: "white",
  character: '".✶."',
  renderMode: "dots",
  amplitudeX: 4,
  amplitudeY: 2,
  sampleCount: 3000,
  freqA: 9,
  freqB: 5,
  initialPhase: 5.5,
  duration: 300,
};

const DUAL_IMAGES: AnimatedPhotoProps[] = [
  {
    src: light01,
    delay: 0.2,
    label: "( 01 )",  
    mobileObjectFit: "cover",
    wrapperClassName:'[grid-column-start:2] md:[grid-column-start:auto] [&>p]:max-sm:text-slate-400 [&>p]:pl-1.5 [&>p]:pb-1',
  },
  {
    src: dark01,
    delay: 0.3,
    label: "( 02 )",
    mobileObjectFit: "cover",
    wrapperClassName:'[grid-column-start:3] md:[grid-column-start:auto] [&>p]:pl-1.5 [&>p]:pb-1',
  },
  {
    src: light02,
    delay: 0.4,
    label: "( 03 )",
    wrapperClassName:'[grid-column-start:4] md:[grid-column-start:auto] [&>p]:max-sm:text-slate-400 [&>p]:pl-1.5 [&>p]:pb-1',
    mobileObjectFit: "cover",
  },
  {
    src: light03,
    wrapperClassName: "[grid-row:3] [grid-column-start:2] md:[grid-row:auto] md:[grid-column-start:auto] [&>p]:max-sm:text-slate-400 [&>p]:pl-1.5 [&>p]:pb-1",
    delay: 0.5,
    label: "( 04 )",
    mobileObjectFit: "cover",
  },
  {
    src: dark02,
    wrapperClassName: "[grid-row:3] [grid-column-start:3] md:[grid-row:auto] md:[grid-column-start:auto] [&>p]:pl-1.5 [&>p]:pb-1",
    delay: 0.6,
    label: "( 05 )",
    mobileObjectFit: "cover",
  },
  {
    src: light04,
    wrapperClassName: "[grid-row:3] [grid-column-start:4] md:[grid-row:auto] md:[grid-column-start:auto] [&>p]:max-sm:text-slate-400 [&>p]:pl-1.5 [&>p]:pb-1",
    delay: 0.7,
    label: "( 06 )",
    mobileObjectFit: "cover",
  },
  {
    src: bg,
    objectFit: "cover",
    wrapperClassName:
      "w-full [grid-column:1/span_5] [grid-row:2] md:[grid-row:auto] md:[grid-column:1/span_6]",
    delay: 1,
  },
];

function Dual() {
  return (
    <div className="bg-slate-400 h-dvh relative overflow-hidden">
      <Lissajous {...lissajousConfig} classname="absolute overflow-hidden" />

      <motion.div
        initial={{ scale: 0.3, opacity: 0, position: "absolute", inset: 0, zIndex: 10 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 1.6 }}
        className="flex items-center justify-center pointer-events-none"
      >
        <BorderIsland
          bitmap={techHeartPattern.filter((i) => i.includes(1))}
          colors={["white"]}
          className="z-10 opacity-30 size-fit pointer-events-none"
          squareSize="size-[2.3px] md:size-1"
        />
      </motion.div>
      <div className="grid grid-cols-[0.01fr_1fr_1fr_1fr_0.01fr] md:grid-cols-6 gap-3 md:gap-6 max-sm:py-4 pt-4 justify-between h-dvh grid-rows-3 md:grid-rows-[1fr_2.3fr] justify-items-center!">
        {DUAL_IMAGES.map((item, i) => (
          <AnimatedPhoto key={`dual-image-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default Dual;
