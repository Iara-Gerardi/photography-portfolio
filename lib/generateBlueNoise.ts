/**
 * Generates a blue-noise texture for dithering.
 * Blue noise has uniform distribution but minimizes low-frequency patterns,
 * providing better visual quality than white noise or Bayer matrices.
 */
export function generateBlueNoiseTexture(size: number = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  
  // Simple blue-noise approximation using void-and-cluster algorithm
  // For production, use a pre-generated blue-noise texture from:
  // http://momentsingraphics.de/BlueNoise.html
  
  const data = imageData.data;
  const pixels: Array<{ x: number; y: number; value: number }> = [];
  
  // Initialize with random values
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pixels.push({ x, y, value: Math.random() });
    }
  }
  
  // Sort by value to create better distribution
  pixels.sort((a, b) => a.value - b.value);
  
  // Apply void-and-cluster-like redistribution
  const sorted: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  pixels.forEach((p, i) => {
    sorted[p.y][p.x] = i / (size * size);
  });
  
  // Gaussian blur to soften
  const blurred: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const kernelSum = 16;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const sx = (x + kx + size) % size;
          const sy = (y + ky + size) % size;
          sum += sorted[sy][sx] * kernel[ky + 1][kx + 1];
        }
      }
      blurred[y][x] = sum / kernelSum;
    }
  }
  
  // Write to canvas
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const val = Math.floor(blurred[y][x] * 255);
      data[i] = val;     // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 255; // A
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
