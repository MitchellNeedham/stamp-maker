import { useEffect, useMemo, useState } from 'react';
import './App.css';
import ImageDropzone from './components/ImageDropzone';
import ControlPanel from './components/ControlPanel';
import StampViewer from './components/StampViewer';
import { imageToLuminance, loadImageFile, type Luminance } from './lib/imageProcessing';
import { traceBands, type TraceResult } from './lib/traceImage';
import { buildStampGeometry } from './lib/buildStampGeometry';
import { exportOBJ, exportSTL } from './lib/exportMesh';
import { DEFAULT_STAMP_PARAMS, type StampParams } from './types';

const TRACE_DEBOUNCE_MS = 200;

function App() {
  const [params, setParams] = useState<StampParams>(DEFAULT_STAMP_PARAMS);
  const [luminance, setLuminance] = useState<Luminance | null>(null);
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setError(null);
    try {
      const img = await loadImageFile(file);
      setLuminance(imageToLuminance(img));
    } catch {
      setError('Could not load that image.');
    }
  };

  // Re-tracing is the expensive step, so it is debounced and only depends on
  // the params that actually change the traced curves.
  useEffect(() => {
    if (!luminance) return;
    setIsTracing(true);
    const timer = setTimeout(() => {
      setTrace(
        traceBands(luminance, {
          levels: params.levels,
          smoothing: params.smoothing,
          invert: params.invert,
        })
      );
      setIsTracing(false);
    }, TRACE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luminance, params.levels, params.smoothing, params.invert]);

  const model = useMemo(() => {
    if (!trace) return null;
    return buildStampGeometry(trace, {
      maxHeight: params.maxHeight,
      baseThickness: params.baseThickness,
      width: params.width,
      mirror: params.mirror,
    });
  }, [trace, params.maxHeight, params.baseThickness, params.width, params.mirror]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stamp Maker</h1>
        <p>Turn a photo into a 3D-printable relief stamp.</p>
      </header>

      <main className="App-main">
        <aside className="App-sidebar">
          <ImageDropzone onFileSelected={handleFileSelected} />
          {error && <p className="error-text">{error}</p>}
          {luminance && <ControlPanel params={params} onChange={setParams} />}
          {isTracing && <p className="status-text">Tracing…</p>}

          {model && (
            <div className="export-row">
              <button onClick={() => exportSTL(model)}>Export STL</button>
              <button onClick={() => exportOBJ(model)}>Export OBJ</button>
            </div>
          )}
        </aside>

        <div className="App-viewer">
          <StampViewer model={model} />
          {!luminance && <div className="viewer-placeholder">Upload a photo to begin</div>}
        </div>
      </main>
    </div>
  );
}

export default App;
