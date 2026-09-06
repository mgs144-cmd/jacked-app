'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { getCroppedImageBlob } from '@/lib/imageCrop'
import { Loader2, X } from 'lucide-react'

const DEFAULT_ASPECT = 4 / 5

type ImageCropModalProps = {
  imageSrc: string
  open: boolean
  onClose: () => void
  onCropped: (file: File) => void
  aspectRatio?: number
  title?: string
}

export function ImageCropModal({
  imageSrc,
  open,
  onClose,
  onCropped,
  aspectRatio = DEFAULT_ASPECT,
  title = 'Crop for feed (4:5)',
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels) return
    setBusy(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      const file = new File([blob], `post-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCropped(file)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const remote = imageSrc.startsWith('http://') || imageSrc.startsWith('https://')

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-sm font-medium text-white">{title}</p>
        <button type="button" onClick={onClose} className="p-2 rounded-full text-white/70 hover:bg-white/10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-[280px]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={0}
          aspect={aspectRatio}
          minZoom={0.2}
          maxZoom={4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
          objectFit="contain"
          mediaProps={remote ? { crossOrigin: 'anonymous' } : {}}
        />
      </div>

      <div className="p-4 space-y-3 border-t border-white/10 bg-black">
        <label className="block text-[11px] text-white/50 mb-1">
          Zoom — zoom out to include more around the photo (matches black bars in the feed)
        </label>
        <input
          type="range"
          min={0.2}
          max={4}
          step={0.02}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-white"
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !croppedAreaPixels}
            onClick={handleApply}
            className="flex-1 btn btn-primary gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Use crop
          </button>
        </div>
      </div>
    </div>
  )
}
