import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export function SignaturePad({ onDrawEnd }: { onDrawEnd: (blob: Blob) => void }) {
  const ref = useRef<SignatureCanvas>(null);

  const handleDone = () => {
    if (ref.current?.isEmpty()) return;
    
    // Get the blob and send it up to the parent
    ref.current!.getTrimmedCanvas().toBlob((blob) => {
      if (blob) onDrawEnd(blob);
    }, "image/png");
  };

  return (
    <div className="border rounded-lg p-2 bg-white">
      <SignatureCanvas
        ref={ref}
        penColor="blue"
        canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
      />
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={() => ref.current?.clear()} className="text-xs text-[#757680] hover:text-[#45464f] transition-colors">
          Clear
        </button>
        <button type="button" onClick={handleDone} className="text-xs bg-[#1b2e5e] hover:bg-[#011848] text-white px-2 py-1 rounded transition-colors">
          Done Drawing
        </button>
      </div>
    </div>
  );
}
