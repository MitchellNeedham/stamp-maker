import * as THREE from 'three';
import ImageTracer from 'imagetracerjs';
import type { TracePath, TraceSegment } from 'imagetracerjs';
import { applyContrast, blurLuminance, thresholdMask, type Luminance } from './imageProcessing';
import type { TraceParams } from '../types';

const QUADRATIC_SAMPLES = 6;

export interface Contour {
  outer: THREE.Vector2[];
  holes: THREE.Vector2[][];
}

export interface TracedBand {
  contours: Contour[];
}

export interface TraceResult {
  /**
   * Ordered smallest/most-exclusive (index 0) to largest/most-inclusive (last).
   * Index 0 is the darkest pixels unless `invert` was set, in which case it's the lightest.
   */
  bands: TracedBand[];
  imageWidth: number;
  imageHeight: number;
}

const BLACK = { r: 0, g: 0, b: 0, a: 255 };
const WHITE = { r: 255, g: 255, b: 255, a: 255 };

function segmentsToPoints(segments: TraceSegment[]): THREE.Vector2[] {
  if (segments.length === 0) return [];
  const points: THREE.Vector2[] = [new THREE.Vector2(segments[0].x1, segments[0].y1)];
  for (const seg of segments) {
    if (seg.type === 'Q' && seg.x3 !== undefined && seg.y3 !== undefined) {
      const curve = new THREE.QuadraticBezierCurve(
        points[points.length - 1].clone(),
        new THREE.Vector2(seg.x2, seg.y2),
        new THREE.Vector2(seg.x3, seg.y3)
      );
      points.push(...curve.getPoints(QUADRATIC_SAMPLES).slice(1));
    } else {
      points.push(new THREE.Vector2(seg.x2, seg.y2));
    }
  }
  return points;
}

function layerToContours(layer: TracePath[]): Contour[] {
  const contours: Contour[] = [];
  for (const path of layer) {
    if (path.isholepath || path.segments.length === 0) continue;
    const outer = segmentsToPoints(path.segments);
    const holes = path.holechildren
      .map((holeIdx) => layer[holeIdx])
      .filter((holePath): holePath is TracePath => !!holePath && holePath.segments.length > 0)
      .map((holePath) => segmentsToPoints(holePath.segments));
    contours.push({ outer, holes });
  }
  return contours;
}

/**
 * Traces `levels` cumulative brightness-threshold masks into smooth vector contours.
 * Bands nest inside each other (index 0 smallest, last index largest), so downstream
 * geometry building can always treat index 0 as the tallest. `invert` decides which
 * physical pixels land in that small/exclusive band: the darkest (default) or the
 * lightest, by mirroring the threshold and flipping the comparison direction.
 */
export function traceBands(lum: Luminance, params: TraceParams): TraceResult {
  const contrasted = applyContrast(lum, params.contrast);
  const smoothed = blurLuminance(contrasted, params.smoothing * 0.3);

  // smoothing 0..10 -> curve-fitting tolerance and minimum kept path size.
  const ltres = 0.2 + params.smoothing * 0.5;
  const qtres = 0.2 + params.smoothing * 0.5;
  const pathomit = 4 + params.smoothing * 4;

  const bands: TracedBand[] = [];
  for (let j = 0; j < params.levels; j++) {
    const darkThreshold = (255 * (j + 1)) / (params.levels + 1);
    const threshold = params.invert ? 255 - darkThreshold : darkThreshold;
    const mask = thresholdMask(smoothed, threshold, params.invert);

    const tracedata = ImageTracer.imagedataToTracedata(mask, {
      pal: [BLACK, WHITE],
      colorquantcycles: 1,
      ltres,
      qtres,
      pathomit,
      rightangleenhance: true,
    });

    const darkLayer = tracedata.layers[0] ?? [];
    bands.push({ contours: layerToContours(darkLayer) });
  }

  return { bands, imageWidth: lum.width, imageHeight: lum.height };
}
