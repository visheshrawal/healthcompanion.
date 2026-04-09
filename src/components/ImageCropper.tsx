import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { Point, Area } from 'react-easy-crop/types'

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: Blob) => void
  onCancel: () => void
}

export function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropCompleteHandler = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return

    const canvas = document.createElement('canvas')
    const img = new Image()
    img.src = image
    
    await new Promise((resolve) => {
      img.onload = resolve
    })

    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(
      img,
      croppedAreaPixels.x * scaleX,
      croppedAreaPixels.y * scaleY,
      croppedAreaPixels.width * scaleX,
      croppedAreaPixels.height * scaleY,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    )

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob)
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/20 rounded-xl p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Crop Profile Photo</h2>
        
        <div className="relative w-full h-80 bg-slate-800 rounded-lg overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-2">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={createCroppedImage}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}