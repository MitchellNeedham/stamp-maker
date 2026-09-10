import { useRef, useState } from 'react';

interface ImageDropzoneProps {
  onFileSelected: (file: File) => void;
}

export default function ImageDropzone({ onFileSelected }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      onFileSelected(file);
    }
  };

  return (
    <div
      className={`dropzone${isDragOver ? ' dropzone-active' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <p>Click or drop a photo here</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
