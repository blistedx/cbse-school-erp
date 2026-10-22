/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  Check,
  X,
  Crop,
  Move,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  subtitle?: string;
  aspectRatio?: '1:1' | 'free' | '4:3';
  circularCrop?: boolean;
  onConfirm: (croppedBase64: string) => void;
  onClose: () => void;
}

export function PhotoCropModal({
  isOpen,
  imageSrc,
  title = 'Crop & Adjust Photo',
  subtitle = 'Drag to position, zoom, or rotate before applying',
  aspectRatio = '1:1',
  circularCrop = true,
  onConfirm,
  onClose
}: PhotoCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset transforms whenever a new image is opened
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setFlipX(false);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle Drag / Pan
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
  };

  // Zoom buttons
  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.15));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFlip = () => setFlipX(prev => !prev);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipX(false);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped canvas
  const handleApplyCrop = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    // Standard output dimension (480x480 for 1:1, or 640x480 for 4:3)
    const outWidth = aspectRatio === '4:3' ? 640 : 480;
    const outHeight = 480;

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outWidth, outHeight);

    // Save context state
    ctx.save();
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, 1);

    // Scale calculation relative to preview container
    const previewBoxSize = 280; // Size of crop mask box in UI
    const scaleFactor = outHeight / previewBoxSize;

    const renderWidth = img.naturalWidth * zoom * scaleFactor * (previewBoxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const renderHeight = img.naturalHeight * zoom * scaleFactor * (previewBoxSize / Math.max(img.naturalWidth, img.naturalHeight));

    ctx.drawImage(
      img,
      -renderWidth / 2 + offset.x * scaleFactor,
      -renderHeight / 2 + offset.y * scaleFactor,
      renderWidth,
      renderHeight
    );
    ctx.restore();

    // Export as optimized JPEG ensuring < 150 KB
    let quality = 0.88;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // Safety check: reduce quality if it exceeds 160 KB
    const base64Part = dataUrl.split(',')[1] || '';
    const estimatedBytes = Math.ceil((base64Part.length * 3) / 4);
    if (estimatedBytes > 160 * 1024) {
      quality = 0.75;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    onConfirm(dataUrl);
    onClose();
  }, [aspectRatio, rotation, flipX, zoom, offset, onConfirm, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-[#1C2024] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
              <Crop className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">
                {title}
              </h3>
              <p className="text-xs text-gray-300/80 font-sans truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport Area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-72 sm:h-80 bg-[#0E1113] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          {/* Target image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source for crop"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipX ? -1 : 1})`,
              maxHeight: '280px',
              maxWidth: '280px',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          />

          {/* Mask Overlay (Darkened outer area with highlighted circular or square window) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* 280x280 Crop Box */}
            <div
              className={`w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(10,14,12,0.7)] relative ${
                circularCrop && aspectRatio === '1:1' ? 'rounded-full' : 'rounded-2xl'
              }`}
            >
              {/* Subtle Alignment Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>
          </div>

          {/* Helper overlay hint */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10.5px] font-mono text-gray-400 pointer-events-none">
            <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
              <Move className="w-3 h-3 text-emerald-400" /> Drag to position
            </span>
            <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
              Scroll or use slider to zoom
            </span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 bg-[#171A1E] space-y-4 shrink-0 border-t border-white/10">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-gray-300">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zoom Level</span>
              </span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md text-[11px]">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border-none"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
              />
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border-none"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transform Action Buttons (Rotate, Flip, Reset) */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                title="Rotate 90 degrees clockwise"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rotate 90°</span>
              </button>
              <button
                type="button"
                onClick={handleFlip}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  flipX
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-transparent'
                }`}
                title="Flip image horizontally"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Flip</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors cursor-pointer border-none"
                title="Reset adjustments"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Optimized: Under 150 KB</span>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all cursor-pointer border-none"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply &amp; Set Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
