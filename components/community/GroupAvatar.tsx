'use client'

import Image from 'next/image'
import { groupAvatarGradient } from '@/lib/groupAvatar'

const outerSize = {
  md: 'w-14 h-14',
  lg: 'w-[72px] h-[72px]',
} as const

interface GroupAvatarProps {
  name: string
  groupId: string
  avatarUrl?: string | null
  size?: keyof typeof outerSize
  className?: string
}

/** Group icon: custom photo, or a stable random color (no member collage). */
export function GroupAvatar({ name, groupId, avatarUrl, size = 'lg', className = '' }: GroupAvatarProps) {
  const gradient = groupAvatarGradient(groupId)
  const outer = outerSize[size]
  const hasPhoto = Boolean(avatarUrl?.trim())

  return (
    <div
      className={`${outer} rounded-full p-[2.5px] bg-gradient-to-br ${gradient} shadow-[0_4px_20px_rgba(0,0,0,0.45)] ${className}`}
      title={name}
    >
      <div className="relative w-full h-full rounded-full overflow-hidden bg-[#0d0d0d] border border-black/50">
        {hasPhoto ? (
          <Image src={avatarUrl!} alt="" fill className="object-cover" sizes="80px" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} aria-hidden />
        )}
      </div>
    </div>
  )
}
