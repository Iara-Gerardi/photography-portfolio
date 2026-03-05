"use client";
import React from "react";
import Lissajous from "@/components/Lissajous/Lissajous";
import AnimatedPhoto from "@/components/AnimatedPhoto";
import { STREET_ITEMS } from "./img";

const lissajousConfig: React.ComponentProps<typeof Lissajous> = {
  color: "white",
  character: "+",
  renderMode: "dots",
  amplitudeX: 4,
  amplitudeY: 0.8,
  sampleCount: 2400,
  freqA: 9,
  freqB: 8,
  initialPhase: 4,
  duration: 300,
};

export default function Street() {
  return (
    <div className="bg-black min-h-screen">
      <Lissajous {...lissajousConfig} classname="absolute overflow-hidden" />
      <div className="grid grid-cols-3 gap-3 p-4" style={{ height: "100vh" }}>
        {STREET_ITEMS.map((item, i) => (
          <AnimatedPhoto key={`grid-item-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
