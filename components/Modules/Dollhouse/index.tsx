"use client";
import React from "react";
import BorderIsland from "@/components/Island/BorderIsland";
import { ornamentPattern } from "@/components/Island/patterns/ornament";
import AnimatedPhoto from "@/components/AnimatedPhoto";
import { ITEMS } from "./images";

function Dollhouse() {
  return (
    <div className="bg-slate-400 min-h-screen relative">
      <BorderIsland
        bitmap={ornamentPattern}
        colors={["#d0d5db", "#bacfd4", "#acc3cb", "#a9c9d6"]}
        squareSize="size-[2px] md:size-[3.5px]"
        className="absolute inset-0"
      />
      <div
        className="grid grid-cols-4 gap-3 p-4"
        style={{ height: "100vh", gridTemplateRows: "1fr 1fr 2.05fr" }}
      >
        {ITEMS.map((item, i) => (
          <AnimatedPhoto key={`grid-item-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default Dollhouse;
