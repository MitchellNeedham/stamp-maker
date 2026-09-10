import * as THREE from 'three';
import type { Contour, TraceResult } from './traceImage';
import type { GeometryParams } from '../types';

const BODY_COLOR = 0xd8863b;

function contourToShape(
  contour: Contour,
  imageWidth: number,
  mirror: boolean
): THREE.Shape {
  // Traced points are in image pixel space (x right, y down). Mirror flips x here
  // (baked into the point data, not a negative-scale transform, so triangulation
  // winding and exported normals stay correct). Negating y lines up with the
  // rotation applied when the mesh is laid flat, below.
  const mapPoint = (p: THREE.Vector2) =>
    new THREE.Vector2(mirror ? imageWidth - p.x : p.x, -p.y);

  const shape = new THREE.Shape(contour.outer.map(mapPoint));
  for (const hole of contour.holes) {
    shape.holes.push(new THREE.Path(hole.map(mapPoint)));
  }
  return shape;
}

/**
 * Extrudes each traced brightness band to its own height and stacks them on a base.
 * Bands are cumulative (each contains the next), so stacking them without any boolean
 * union produces a stepped relief with no gaps, the standard contour-print technique.
 */
export function buildStampGeometry(trace: TraceResult, params: GeometryParams): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: BODY_COLOR, roughness: 0.6 });

  const scale = params.width / trace.imageWidth;
  const modelDepth = trace.imageHeight * scale;
  const levels = trace.bands.length;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(params.width, params.baseThickness, modelDepth),
    material
  );
  base.position.set(params.width / 2, params.baseThickness / 2, modelDepth / 2);
  base.receiveShadow = true;
  group.add(base);

  trace.bands.forEach((band, index) => {
    if (band.contours.length === 0) return;

    // index 0 is always the smallest/most-exclusive band (traceBands guarantees this,
    // flipping which physical pixels that means when invert is set), so it's the tallest.
    const heightFraction = (levels - index) / levels;
    const bandHeight = params.maxHeight * heightFraction;
    if (bandHeight <= 0) return;

    const shapes = band.contours.map((c) => contourToShape(c, trace.imageWidth, params.mirror));
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: bandHeight,
      bevelEnabled: false,
      curveSegments: 12,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(scale, scale, 1);
    mesh.position.set(0, params.baseThickness, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  group.position.x -= params.width / 2;
  group.position.z -= modelDepth / 2;

  return group;
}
