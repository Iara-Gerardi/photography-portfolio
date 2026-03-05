"use client";

import React, { useMemo, ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Lissajous curve formula:
 * x(t) = A · sin(a·t + δ)
 * y(t) = B · sin(b·t)
 *
 * Where:
 * - a:b is the frequency ratio (1:1, 1:2, 1:3, 2:3, etc.)
 * - δ (delta) is the phase shift
 * - A, B are the amplitudes (width/height)
 *
 * Common ratios:
 * - 1:1 with δ=π/2 creates a circle/ellipse
 * - 1:2 creates figure-8 patterns
 * - 1:3 creates pretzel-like patterns
 * - 2:3 creates more complex patterns
 */
interface LissajousProps {
  /** Size of the container in pixels */
  size?: number;
  /** Number of parametric samples along the curve */
  sampleCount?: number;
  /** Frequency ratio numerator (a in a:b) */
  freqA?: number;
  /** Frequency ratio denominator (b in a:b) */
  freqB?: number;
  /** Initial phase shift in radians (δ) - determines starting shape */
  initialPhase?: number;
  /** Horizontal amplitude (0-1, relative to container) */
  amplitudeX?: number;
  /** Vertical amplitude (0-1, relative to container) */
  amplitudeY?: number;
  /** Animation duration for one complete phase cycle (seconds) */
  duration?: number;
  /** Whether to animate the phase */
  animate?: boolean;
  /** Render mode: 'dots' for particles, 'path' for SVG line */
  renderMode?: "dots" | "path";
  /** Dot size in pixels (only for dots mode) */
  dotSize?: number;
  /** Stroke width (only for path mode) */
  strokeWidth?: number;
  /** Color of the curve */
  color?: string;
  /** Character to render at each parametric point (single character, dots mode only) */
  character?: string;
  /** Font size for character in pixels */
  fontSize?: number;
  /** A single React element to place at every dot position along the curve, replacing dots/path entirely. Follows the same Lissajous animation. */
  formElement?: ReactNode;
  /** Additional classname for container */
  classname?: string;
}

const Lissajous = ({
  size = 400,
  sampleCount = 100,
  freqA = 1,
  freqB = 2,
  initialPhase = Math.PI / 2, // Start as ellipse/circle, not a line
  amplitudeX = 0.8,
  amplitudeY = 0.8,
  duration = 4,
  animate = false,
  renderMode = "path",
  dotSize = 4,
  strokeWidth = 2,
  color = "#ffffff",
  character,
  fontSize = 12,
  formElement,
  classname,
}: LissajousProps) => {
  // Calculate the number of cycles needed to close the curve
  // For ratio a:b, we need lcm(a,b)/a cycles in t
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
  const totalCycles = lcm(freqA, freqB) / freqA;

  // Precompute parametric samples (t values from 0 to 2π * cycles)
  const tValues = useMemo(() => {
    const samples: number[] = [];
    const maxT = Math.PI * 2 * totalCycles;
    for (let i = 0; i <= sampleCount; i++) {
      samples.push((i / sampleCount) * maxT);
    }
    return samples;
  }, [sampleCount, totalCycles]);

  // Calculate position for a given t and phase
  // x(t) = A · sin(a·t + δ)
  // y(t) = B · sin(b·t)
  const calculatePosition = (t: number, phase: number) => {
    const halfSize = size / 2;
    const x = amplitudeX * halfSize * Math.sin(freqA * t + phase);
    const y = amplitudeY * halfSize * Math.sin(freqB * t);
    return { x, y };
  };

  // Generate SVG path data for a given phase
  const generatePathData = (phase: number) => {
    const points = tValues.map((t) => calculatePosition(t, phase));
    if (points.length === 0) return "";

    const pathParts = points.map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd} ${p.x} ${p.y}`;
    });

    return pathParts.join(" ") + " Z"; // Close the path
  };

  // Generate path data for multiple phases (keyframes)
  const pathKeyframes = useMemo(() => {
    if (!animate) {
      return [generatePathData(initialPhase)];
    }

    // Create keyframes for smooth phase animation (0 to 2π)
    const keyframeCount = 60; // More keyframes for smoother SVG morphing
    const paths: string[] = [];

    for (let i = 0; i <= keyframeCount; i++) {
      const phase = initialPhase + (i / keyframeCount) * Math.PI * 2;
      paths.push(generatePathData(phase));
    }

    return paths;
  }, [
    animate,
    initialPhase,
    tValues,
    amplitudeX,
    amplitudeY,
    freqA,
    freqB,
    size,
  ]);

  // For dots mode: precompute positions at each phase keyframe
  const dotKeyframes = useMemo(() => {
    if (renderMode !== "dots" && !formElement) return [];

    const keyframeCount = animate ? 30 : 1;
    const frames: Array<Array<{ x: number; y: number }>> = [];

    for (let k = 0; k <= keyframeCount; k++) {
      const phase = animate
        ? initialPhase + (k / keyframeCount) * Math.PI * 2
        : initialPhase;

      const positions = tValues.map((t) => calculatePosition(t, phase));
      frames.push(positions);
    }

    return frames;
  }, [
    renderMode,
    animate,
    initialPhase,
    tValues,
    amplitudeX,
    amplitudeY,
    freqA,
    freqB,
    size,
    formElement,
  ]);

  // Generate times array for keyframes
  const generateTimes = (count: number) => {
    return Array.from({ length: count }, (_, i) => i / (count - 1));
  };

  return (
    <div
      className={`flex items-center justify-center w-full h-full ${classname}`}
    >
      {/* Fixed-size square container with centered coordinate system */}
      <div
        className="relative"
        style={{
          width: size,
          height: size,
        }}
      >
        {formElement && dotKeyframes.length > 0 ? (
          /* Form Element Mode - a React element cloned at every dot position */
          tValues.map((_, index) => {
            const xKeyframes = dotKeyframes.map(
              (frame) => (frame[index]?.x ?? 0) + size / 2,
            );
            const yKeyframes = dotKeyframes.map(
              (frame) => (frame[index]?.y ?? 0) + size / 2,
            );

            return (
              <motion.div
                key={`form-el-${index}`}
                className="absolute"
                style={{
                  transform: "translate(-50%, -50%)",
                }}
                initial={{
                  left: xKeyframes[0],
                  top: yKeyframes[0],
                }}
                animate={{
                  left: xKeyframes,
                  top: yKeyframes,
                }}
                transition={{
                  duration: animate ? duration : 0,
                  repeat: animate ? Infinity : 0,
                  ease: "linear",
                  times: generateTimes(xKeyframes.length),
                }}
              >
                {formElement}
              </motion.div>
            );
          })
        ) : renderMode === "path" ? (
          /* SVG Path Mode - smoother and more performant */
          <svg
            width={size}
            height={size}
            viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
            style={{ overflow: "visible" }}
          >
            <motion.path
              d={pathKeyframes[0]}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{
                d: pathKeyframes,
              }}
              transition={{
                duration: animate ? duration : 0,
                repeat: animate ? Infinity : 0,
                ease: "linear",
                times: generateTimes(pathKeyframes.length),
              }}
            />
          </svg>
        ) : (
          /* Dots Mode - particles positioned absolutely */
          <svg
            width={size}
            height={size}
            viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
            style={{ overflow: "visible" }}
          >
            {tValues.map((_, index) => {
              // Generate x and y keyframes for this dot
              const xKeyframes = dotKeyframes.map(
                (frame) => frame[index]?.x ?? 0,
              );
              const yKeyframes = dotKeyframes.map(
                (frame) => frame[index]?.y ?? 0,
              );

              // Render character if provided, otherwise render circle
              if (character) {
                return (
                  <motion.text
                    key={`dot-${index}`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={fontSize}
                    fontFamily="monospace"
                    fontWeight="bold"
                    style={{ userSelect: "none" }}
                    initial={{
                      x: xKeyframes[0],
                      y: yKeyframes[0],
                    }}
                    animate={{
                      x: xKeyframes,
                      y: yKeyframes,
                    }}
                    transition={{
                      duration: animate ? duration : 0,
                      repeat: animate ? Infinity : 0,
                      ease: "linear",
                      times: generateTimes(xKeyframes.length),
                    }}
                  >
                    {character}
                  </motion.text>
                );
              }

              // Default: render circle
              return (
                <motion.circle
                  key={`dot-${index}`}
                  r={dotSize / 2}
                  fill={color}
                  initial={{
                    cx: xKeyframes[0],
                    cy: yKeyframes[0],
                  }}
                  animate={{
                    cx: xKeyframes,
                    cy: yKeyframes,
                  }}
                  transition={{
                    duration: animate ? duration : 0,
                    repeat: animate ? Infinity : 0,
                    ease: "linear",
                    times: generateTimes(xKeyframes.length),
                  }}
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default Lissajous;
