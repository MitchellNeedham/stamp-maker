declare module 'imagetracerjs' {
  export interface TraceSegment {
    type: 'L' | 'Q';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3?: number;
    y3?: number;
  }

  export interface TracePath {
    segments: TraceSegment[];
    isholepath: boolean;
    holechildren: number[];
    boundingbox: [number, number, number, number];
  }

  export type TraceLayer = TracePath[];

  export interface PaletteColor {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  export interface TraceData {
    layers: TraceLayer[];
    palette: PaletteColor[];
    width: number;
    height: number;
  }

  export interface TraceOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    rightangleenhance?: boolean;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    pal?: PaletteColor[];
    blurradius?: number;
    blurdelta?: number;
    [key: string]: unknown;
  }

  interface ImageTracerStatic {
    imagedataToTracedata(imgd: ImageData, options?: TraceOptions): TraceData;
  }

  const ImageTracer: ImageTracerStatic;
  export default ImageTracer;
}
