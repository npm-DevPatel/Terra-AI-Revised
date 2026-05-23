import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Camera, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';
import heic2any from 'heic2any';

/**
 * Uploader — drag-and-drop image uploader.
 * CRITICAL: Stores BOTH the base64 preview URL (for CinematicScanner display)
 * AND the raw File object (for FormData submission to /api/vision/analyze).
 * The vision API requires multipart/form-data with an `image` file field.
 */
export default function Uploader({ onUploaded }) {
  const { setUploadedImage } = useTerraStore();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const processFile = useCallback(
    async (file) => {
      setError(null);
      if (!file) return;

      let processedFile = file;

      // Handle HEIC/HEIF files manually
      if (file.type.includes('heic') || file.type.includes('heif') || file.name.toLowerCase().endsWith('.heic')) {
        try {
          // Convert to JPEG blob
          const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
          const finalBlob = Array.isArray(blob) ? blob[0] : blob;
          processedFile = new File([finalBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (err) {
          setError('Failed to process HEIC image. Please try a different format.');
          return;
        }
      }

      if (!processedFile.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG, WEBP).');
        return;
      }
      if (processedFile.size > 20 * 1024 * 1024) {
        setError('Image too large. Maximum size is 20MB.');
        return;
      }

      // Generate preview URL via FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setPreview(dataUrl);
        setFileName(processedFile.name);
        // Store both dataUrl (preview) AND the raw File object (for FormData)
        setUploadedImage(dataUrl, processedFile.name, processedFile);
        onUploaded?.(dataUrl, processedFile.name, processedFile);
      };
      reader.readAsDataURL(processedFile);
    },
    [setUploadedImage, onUploaded]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleChange = (e) => processFile(e.target.files?.[0]);

  const clearImage = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-50"
          >
            <img
              src={preview}
              alt="Uploaded land image"
              className="w-full max-h-80 object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-terra-body">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium truncate max-w-[200px]">{fileName}</span>
              </div>
              <button
                onClick={clearImage}
                className="flex items-center gap-1.5 text-xs text-terra-muted hover:text-red-500 transition-colors font-medium"
              >
                <X className="w-3.5 h-3.5" /> Change
              </button>
            </div>
          </motion.div>
        ) : (
          <div
            key="dropzone"
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={clsx(
              'flex flex-col items-center justify-center gap-6',
              'border-2 border-dashed rounded-2xl py-12 px-6',
              'transition-all duration-200',
              dragging
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
            )}
          >
            <motion.div
              animate={{ scale: dragging ? 1.12 : 1 }}
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm"
            >
              {dragging
                ? <ImageIcon className="w-7 h-7 text-emerald-500" />
                : <UploadCloud className="w-7 h-7 text-slate-400" />}
            </motion.div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-terra-heading mb-1">
                {dragging ? 'Drop your image here' : 'Provide a land photo'}
              </p>
              <p className="text-xs text-terra-muted max-w-[240px] mx-auto">
                Take a picture or upload from your device. HEIC, JPG, PNG supported.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-500 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Browse Gallery
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        id="terra-camera-input"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        id="terra-gallery-input"
      />
    </div>
  );
}
