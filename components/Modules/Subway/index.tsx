"use client";
import React from "react";
import SubwayAnimatedPhoto from "./SubwayAnimatedPhoto";
import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";
import img1 from "./photos/non liminal 1.jpg";
import img2 from "./photos/non liminal 2.jpg";
import img3 from "./photos/non liminal 3.jpg";
import img4 from "./photos/non liminal 4.jpg";
import img5 from "./photos/non liminal 5.png";
import img6 from "./photos/non liminal 6.jpg";
import img7 from "./photos/non liminal 7.jpg";
import img8 from "./photos/non liminal 8.jpg";
import img9 from "./photos/non liminal 9.jpg";
import img10 from "./photos/non liminal 10.jpg";
import img11 from "./photos/non liminal 11.jpg";
import img12 from "./photos/non liminal 12.jpg";
import img13 from "./photos/non liminal 13.jpg";
import img14 from "./photos/non liminal 14.png";
import img15 from "./photos/non liminal 15.jpg";
import Lissajous from "@/components/Lissajous/Lissajous";

const lissajousConfig: React.ComponentProps<typeof Lissajous> = {
  color: "white",
  character: "+",
  renderMode: "dots",
  amplitudeX: 4,
  amplitudeY: 1.7,
  sampleCount: 2400,
  freqA: 9,
  freqB: 8,
  initialPhase: 3,
  duration: 300,
};

const SUBWAY_IMAGES: AnimatedPhotoProps[] = [
  { src: img8, delay: 1.5 ,label:"( ??? )"},
  { src: img3, delay: 0.9 ,label:"( ??? )"},
  { src: img2, delay: 0.6 ,label:"( ??? )"},
  { src: img13, delay: 0.9,label:"( ??? )" },
  { src: img9, delay: 1.5,label:"( ??? )" },

  { src: img7, delay: 1.2 ,label:"( ??? )"},
  { src: img5, delay: 0.6 ,label:"( ??? )"},
  { src: img1, delay: 0.3 ,label:"( ??? )"},
  { src: img14, delay: 0.6 ,label:"( ??? )"},
  { src: img6, delay: 1.2,label:"( ??? )" },

  { src: img10, delay: 1.5 ,label:"( ??? )"},
  { src: img11, delay: 0.9 ,label:"( ??? )"},
  { src: img12, delay: 0.6,label:"( ??? )" },
  { src: img4, delay: 0.9,label:"( ??? )" },
  { src: img15, delay: 1.5 ,label:"( ??? )"},
];

const COVER_INDICES = new Set([1, 3, 11, 13]);

function Subway() {
  return (
    <div className="bg-black min-h-dvh">
      <Lissajous {...lissajousConfig} classname="absolute overflow-hidden" />
      <div className="border-transparent border-20 md:border-50 w-full h-dvh grid grid-cols-3 grid-rows-5 md:grid-cols-5 gap-4 md:gap-2 md:grid-rows-[1fr_2.5fr_1fr] overflow-hidden relative">
        {SUBWAY_IMAGES.map((item, i) => (
          <SubwayAnimatedPhoto
            key={`subway-${i}`}
            item={{
              ...item,
              scale: COVER_INDICES.has(i) ? 1.7 : 1,
              wrapperClassName: `w-full h-full flex items-center justify-center`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Subway;
