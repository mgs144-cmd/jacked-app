export function isGifComment(content: string | null | undefined): boolean {
  if (!content) return false
  return (
    content.startsWith('http') &&
    (content.includes('giphy.com') || content.includes('tenor.com') || content.includes('.gif'))
  )
}
