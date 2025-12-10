import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';

interface Props {
  src: string;
  size?: number; // display square size in px
}

export type SquareCropperHandle = {
  crop: () => Promise<File>;
};

const SquareCropper = forwardRef<SquareCropperHandle, Props>(({ src, size = 256 }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [displayDims, setDisplayDims] = useState<{ w: number; h: number }>({ w: size, h: size });
  const [baseScale, setBaseScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [dragging, setDragging] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      // compute base scale so the image covers the square (object-cover)
      const sBase = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      setBaseScale(sBase);
      setScale(1);
      const dw = img.naturalWidth * sBase;
      const dh = img.naturalHeight * sBase;
      setDisplayDims({ w: dw, h: dh });
      setPos({ left: (size - dw) / 2, top: (size - dh) / 2 });
    };
    img.src = src;
  }, [src, size]);

  const constrain = (left: number, top: number, currentScale = scale) => {
    const dw = (imgDims?.w || 1) * baseScale * currentScale;
    const dh = (imgDims?.h || 1) * baseScale * currentScale;
    const minLeft = size - dw;
    const minTop = size - dh;
    // ensure the image covers the container
    return {
      left: Math.min(0, Math.max(minLeft, left)),
      top: Math.min(0, Math.max(minTop, top)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    const next = constrain(pos.left + dx, pos.top + dy);
    setPos(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    last.current = null;
  };

  const onZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextScale = parseFloat(e.target.value);
    const centerX = size / 2 - pos.left; // current center in image coords (display)
    const centerY = size / 2 - pos.top;
    const prevDW = (imgDims?.w || 1) * baseScale * scale;
    const prevDH = (imgDims?.h || 1) * baseScale * scale;
    const nextDW = (imgDims?.w || 1) * baseScale * nextScale;
    const nextDH = (imgDims?.h || 1) * baseScale * nextScale;

    // keep center point under the same container center
    const scaleRatioW = nextDW / prevDW;
    const scaleRatioH = nextDH / prevDH;
    let left = size / 2 - centerX * scaleRatioW;
    let top = size / 2 - centerY * scaleRatioH;
    const constrained = constrain(left, top, nextScale);
    setPos(constrained);
    setScale(nextScale);
  };

  useImperativeHandle(ref, () => ({
    crop: async () => {
      if (!imgDims) throw new Error('Image not ready');
      const canvas = document.createElement('canvas');
      const outSize = 512; // output size
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const dw = imgDims.w * baseScale * scale;
      const dh = imgDims.h * baseScale * scale;

      const sx = (-pos.left / dw) * imgDims.w;
      const sy = (-pos.top / dh) * imgDims.h;
      const sw = (size / dw) * imgDims.w;
      const sh = (size / dh) * imgDims.h;

      const image = new Image();
      image.src = src;
      await new Promise((res) => {
        if (image.complete) return res(null);
        image.onload = () => res(null);
        image.onerror = () => res(null);
      });

      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outSize, outSize);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve as any, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Failed to crop');
      const file = new File([blob], `avatar-cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
      return file;
    }
  }), [imgDims, baseScale, scale, pos, src, size]);

  const dw = (imgDims?.w || 1) * baseScale * scale;
  const dh = (imgDims?.h || 1) * baseScale * scale;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative mx-auto rounded border border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-white/5"
        style={{ width: size, height: size, overflow: 'hidden', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Crop"
          draggable={false}
          className="select-none"
          style={{ position: 'relative', left: pos.left, top: pos.top, width: dw, height: dh }}
        />
        {/* overlay */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          <div className="border-r border-b border-white/30"></div>
          <div className="border-r border-b border-white/30"></div>
          <div className="border-b border-white/30"></div>
          <div className="border-r border-b border-white/30"></div>
          <div className="border-r border-b border-white/30"></div>
          <div className="border-b border-white/30"></div>
          <div className="border-r border-white/30"></div>
          <div className="border-r border-white/30"></div>
          <div></div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-600 dark:text-gray-300 w-10">Zoom</div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={scale}
          onChange={onZoom}
          className="w-full"
        />
      </div>
    </div>
  );
});

export default SquareCropper;
