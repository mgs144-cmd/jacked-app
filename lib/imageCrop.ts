import type { Area } from 'react-easy-crop'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      image.crossOrigin = 'anonymous'
    }
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (e) => reject(e))
    image.src = url
  })
}

/** Keep crop rect inside decoded bitmap bounds (avoids off-by-one vs react-easy-crop / EXIF). */
function clampCropToImage(image: HTMLImageElement, area: Area): Area {
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  if (iw <= 0 || ih <= 0) return area

  let x = Math.round(area.x)
  let y = Math.round(area.y)
  let width = Math.round(area.width)
  let height = Math.round(area.height)

  x = Math.max(0, Math.min(x, Math.max(0, iw - 1)))
  y = Math.max(0, Math.min(y, Math.max(0, ih - 1)))
  width = Math.max(1, Math.min(width, iw - x))
  height = Math.max(1, Math.min(height, ih - y))

  return { x, y, width, height }
}

/**
 * Renders the cropped region into a fixed output canvas (default 4:5) using uniform scale
 * (letterbox / pillarbox with black) so the saved JPEG matches the cropper preview and feed `object-contain`.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth = 1080,
  outputHeight = 1350,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const safe = clampCropToImage(image, pixelCrop)

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas context')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  const scale = Math.min(outputWidth / safe.width, outputHeight / safe.height)
  const dw = Math.round(safe.width * scale)
  const dh = Math.round(safe.height * scale)
  const dx = Math.floor((outputWidth - dw) / 2)
  const dy = Math.floor((outputHeight - dh) / 2)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, safe.x, safe.y, safe.width, safe.height, dx, dy, dw, dh)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Crop failed'))
      },
      mime,
      quality
    )
  })
}
