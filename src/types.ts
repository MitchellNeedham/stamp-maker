export interface StampParams {
  /** Number of relief height steps traced from the image (posterization bands). */
  levels: number;
  /** Height of the tallest relief point, in millimetres. */
  maxHeight: number;
  /** Thickness of the flat base under the relief, in millimetres. */
  baseThickness: number;
  /** Overall model width, in millimetres (height derives from image aspect ratio). */
  width: number;
  /** Curve smoothing / despeckle amount (0 = follow pixels closely, 10 = very smooth). */
  smoothing: number;
  /** Swap which brightness extreme is raised (dark-raised is the default, stamp-die convention). */
  invert: boolean;
  /** Flip the design horizontally, needed so a pressed stamp impression reads correctly. */
  mirror: boolean;
  /** Push blacks darker and whites brighter (+10) or flatten toward grey (-10) before slicing into levels. */
  contrast: number;
}

export const DEFAULT_STAMP_PARAMS: StampParams = {
  levels: 5,
  maxHeight: 3,
  baseThickness: 2,
  width: 40,
  smoothing: 4,
  invert: false,
  mirror: false,
  contrast: 0,
};

/**
 * Params that require re-tracing the image (expensive: re-run posterize + vectorize).
 * `invert` lives here, not in GeometryParams: bands are cumulative and nested, so which
 * brightness extreme is the small/exclusive (tallest) band has to be decided when the
 * masks are built, not relabelled afterwards.
 */
export type TraceParams = Pick<StampParams, 'levels' | 'smoothing' | 'invert' | 'contrast'>;

/** Params that only affect how already-traced contours are extruded (cheap: rebuild geometry). */
export type GeometryParams = Pick<StampParams, 'maxHeight' | 'baseThickness' | 'width' | 'mirror'>;

export function traceParamsEqual(a: TraceParams, b: TraceParams): boolean {
  return (
    a.levels === b.levels &&
    a.smoothing === b.smoothing &&
    a.invert === b.invert &&
    a.contrast === b.contrast
  );
}
