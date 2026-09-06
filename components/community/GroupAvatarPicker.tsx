'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GroupAvatar } from '@/components/community/GroupAvatar'
import { ImageCropModal } from '@/components/ImageCropModal'
import { persistGroupAvatarUrl, uploadGroupAvatarFile } from '@/lib/groupAvatarUpload'

interface GroupAvatarPickerProps {
  groupId: string
  groupName: string
  avatarUrl: string | null
  onUpdated: (url: string | null) => void
  size?: 'md' | 'lg'
}

export function GroupAvatarPicker({ groupId, groupName, avatarUrl, onUpdated, size = 'lg' }: GroupAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const openFile = () => inputRef.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image.')
      return
    }
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setCropOpen(true)
  }

  const onCropped = async (file: File) => {
    setCropOpen(false)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const publicUrl = await uploadGroupAvatarFile(supabase, groupId, file)
      onUpdated(publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      alert(msg)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async () => {
    if (!avatarUrl) return
    if (!confirm('Remove group photo?')) return
    setUploading(true)
    try {
      const supabase = createClient()
      await persistGroupAvatarUrl(supabase, groupId, null)
      onUpdated(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not remove photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={openFile}
          disabled={uploading}
          className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60"
          aria-label="Change group photo"
        >
          <GroupAvatar name={groupName} groupId={groupId} avatarUrl={avatarUrl} size={size} />
          <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFile}
            disabled={uploading}
            className="text-xs font-medium text-white/60 hover:text-white"
          >
            {avatarUrl ? 'Change photo' : 'Add photo'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => void removePhoto()}
              disabled={uploading}
              className="text-xs text-white/35 hover:text-red-400 flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          open={cropOpen}
          aspectRatio={1}
          title="Crop group photo"
          onClose={() => {
            setCropOpen(false)
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
          }}
          onCropped={onCropped}
        />
      )}
    </>
  )
}
