const GRADIENTS = [
  'from-rose-500 via-orange-500 to-amber-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-cyan-500 via-sky-500 to-blue-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-pink-500 via-rose-500 to-red-500',
  'from-indigo-500 via-blue-500 to-violet-500',
] as const

export function groupAvatarGradient(groupId: string): string {
  const n = groupId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[n % GRADIENTS.length]
}

export function groupInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.trim().slice(0, 2).toUpperCase() || 'GR'
}
