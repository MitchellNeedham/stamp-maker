import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

function download(content: string | ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSTL(object: THREE.Object3D, filename = 'stamp.stl') {
  const exporter = new STLExporter();
  const result = exporter.parse(object, { binary: true });
  download(result.buffer, filename, 'model/stl');
}

export function exportOBJ(object: THREE.Object3D, filename = 'stamp.obj') {
  const exporter = new OBJExporter();
  const result = exporter.parse(object);
  download(result, filename, 'text/plain');
}
