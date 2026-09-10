/** Longest edge an image is downscaled to before tracing, to keep vectorization fast. */
const MAX_TRACE_DIMENSION = 300;

export interface Luminance {
  data: Float32Array;
  width: number;
  height: number;
}

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

export function imageToLuminance(img: HTMLImageElement): Luminance {
  const scale = Math.min(1, MAX_TRACE_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  const lum = new Float32Array(width * height);
  for (let i = 0; i < lum.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return { data: lum, width, height };
}

/** Box blur, used as a pre-trace smoothing step so isolated pixels don't dictate the traced curve. */
export function blurLuminance(lum: Luminance, radius: number): Luminance {
  if (radius <= 0) return lum;
  const { data, width, height } = lum;
  const out = new Float32Array(data.length);
  const r = Math.round(radius);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const sy = y + dy;
        if (sy < 0 || sy >= height) continue;
        for (let dx = -r; dx <= r; dx++) {
          const sx = x + dx;
          if (sx < 0 || sx >= width) continue;
          sum += data[sy * width + sx];
          count++;
        }
      }
      out[y * width + x] = sum / count;
    }
  }
  return { data: out, width, height };
}

/**
 * A binary (black/white) ImageData: black where the pixel is "in" the band, white elsewhere.
 * `above` flips which side of the threshold counts as in (used to build light-cumulative
 * masks for the inverted relief, instead of the default dark-cumulative ones).
 */
export function thresholdMask(lum: Luminance, threshold: number, above: boolean): ImageData {
  const { data, width, height } = lum;
  const imgData = new ImageData(width, height);
  for (let i = 0; i < data.length; i++) {
    const included = above ? data[i] >= threshold : data[i] <= threshold;
    const v = included ? 0 : 255;
    imgData.data[i * 4] = v;
    imgData.data[i * 4 + 1] = v;
    imgData.data[i * 4 + 2] = v;
    imgData.data[i * 4 + 3] = 255;
  }
  return imgData;
}
