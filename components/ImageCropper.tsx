'use client'

import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check } from 'lucide-react'
import 'react-easy-crop/react-easy-crop.css'

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number
}

export function ImageCropper({ image, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    // Convert to blob and then to data URL
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          const reader = new FileReader()
          reader.addEventListener('load', () => resolve(reader.result as string))
          reader.addEventListener('error', (error) => reject(error))
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }

  const handleCropComplete = async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      onCropComplete(croppedImage)
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Failed to crop image')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-white font-bold text-lg">Crop Your Photo</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative w-full" style={{ height: '400px' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) => {
              setCroppedAreaPixels(croppedAreaPixels)
            }}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                position: 'relative',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-800 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              ZOOM
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 btn-secondary py-3 font-bold"
            >
              CANCEL
            </button>
            <button
              onClick={handleCropComplete}
              className="flex-1 btn-primary py-3 font-bold flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>APPLY CROP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

