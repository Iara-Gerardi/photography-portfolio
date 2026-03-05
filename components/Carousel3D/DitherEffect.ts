import { Effect } from "postprocessing";
import { Uniform, Texture, RepeatWrapping, NearestFilter } from "three";

const fragmentShader = /* glsl */ `
uniform sampler2D tBlueNoise;
uniform float uPixelSize;
uniform float uPaletteSize;
uniform float uDitherStrength;
uniform vec2 uResolution;

/**
 * Quantize color to palette levels.
 * Using floor(c * levels + 0.5) provides better rounding than floor(c * levels).
 */
vec3 quantize(vec3 c, float levels) {
  return floor(c * levels + 0.5) / levels;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Calculate pixelated UV by snapping to grid
  vec2 pixelUV = uv;
  if (uPixelSize > 0.0) {
    vec2 pixelGrid = uResolution / uPixelSize;
    pixelUV = (floor(uv * pixelGrid) + 0.5) / pixelGrid;
  }
  
  // Sample scene color from the pixelated UV
  vec3 color = texture2D(inputBuffer, pixelUV).rgb;
  
  // Sample blue noise (tiling, using fragment coordinates for consistent pattern)
  vec2 noiseUV = gl_FragCoord.xy / 64.0; // Assuming 64x64 blue noise texture
  float noise = texture2D(tBlueNoise, noiseUV).r - 0.5;
  
  // Add noise offset scaled by dither strength and inverse palette size
  // This approximates error diffusion by offsetting before quantization
  if (uPaletteSize > 1.0) {
    color += noise * uDitherStrength * (1.0 / uPaletteSize);
  }
  
  // Clamp to valid range before quantizing
  color = clamp(color, 0.0, 1.0);
  
  // Quantize to palette
  if (uPaletteSize > 1.0) {
    color = quantize(color, uPaletteSize);
  }
  
  outputColor = vec4(color, inputColor.a);
}
`;

interface DitherEffectOptions {
  blueNoise: Texture;
  pixelSize?: number;
  paletteSize?: number;
  ditherStrength?: number;
}

/**
 * GPU-based dithering effect using blue-noise approximation of Floyd-Steinberg.
 * 
 * This implements a two-pass approach:
 * 1. Scene renders to WebGLRenderTarget
 * 2. This shader applies pixelation + blue-noise dithering + palette quantization
 * 
 * Blue-noise provides better visual quality than ordered dithering (Bayer matrix)
 * by minimizing low-frequency patterns while maintaining high-frequency detail.
 */
export class DitherEffect extends Effect {
  constructor({ blueNoise, pixelSize = 1, paletteSize = 4, ditherStrength = 1 }: DitherEffectOptions) {
    // Ensure blue noise texture uses proper wrapping and filtering
    blueNoise.wrapS = RepeatWrapping;
    blueNoise.wrapT = RepeatWrapping;
    blueNoise.minFilter = NearestFilter;
    blueNoise.magFilter = NearestFilter;

    super("DitherEffect", fragmentShader, {
      uniforms: new Map([
        ["tBlueNoise", new Uniform(blueNoise)],
        ["uPixelSize", new Uniform(pixelSize)],
        ["uPaletteSize", new Uniform(paletteSize)],
        ["uDitherStrength", new Uniform(ditherStrength)],
        ["uResolution", new Uniform({ x: window.innerWidth, y: window.innerHeight })],
      ] as [string, Uniform<any>][]),
    });
  }

  /**
   * Update pixel size (controls size of dithered blocks).
   * Lower = more detail, higher = more pixelated.
   */
  setPixelSize(size: number) {
    this.uniforms.get("uPixelSize")!.value = size;
  }

  /**
   * Update palette size (number of color levels per channel).
   * Higher = more colors, lower = more posterized.
   */
  setPaletteSize(size: number) {
    this.uniforms.get("uPaletteSize")!.value = size;
  }

  /**
   * Update dither strength (amount of noise applied).
   * 0 = no dither, 1 = full strength.
   */
  setDitherStrength(strength: number) {
    this.uniforms.get("uDitherStrength")!.value = strength;
  }

  /**
   * Update resolution uniform (call on window resize).
   */
  updateResolution(width: number, height: number) {
    const resolution = this.uniforms.get("uResolution")!.value as { x: number; y: number };
    resolution.x = width;
    resolution.y = height;
  }
}
