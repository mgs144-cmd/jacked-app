'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Navbar } from '@/components/Navbar'
import { Loader2 } from 'lucide-react'

export default function CreatePage() {
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMediaFile(file)

    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('image')
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      setMediaType('video')
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      let mediaUrl: string | null = null

      // Upload media if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const filePath = `posts/${fileName}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('media')
          .upload(filePath, mediaFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('media').getPublicUrl(filePath)

        mediaUrl = publicUrl
      }

      // Create post
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content || null,
        media_url: mediaUrl,
        media_type: mediaType,
      })

      if (postError) throw postError

      router.push('/feed')
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Create Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={mediaPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setMediaFile(null)
                  setMediaPreview(null)
                  setMediaType(null)
                }}
                className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-lg hover:bg-black/70"
              >
                Remove
              </button>
            </div>
          )}

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mediaFile ? 'Change Media' : 'Upload Photo or Video'}
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
            />
          </div>

          {/* Caption */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="What's on your mind?"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (!content && !mediaFile)}
            className="w-full py-3 px-4 border border-transparent rounded-lg text-white font-semibold bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

