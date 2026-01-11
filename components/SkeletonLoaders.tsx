export function PostCardSkeleton() {
  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800/60 overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="p-5 flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-800/60" />
        <div className="flex-1">
          <div className="h-4 bg-gray-800/60 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-800/60 rounded w-24" />
        </div>
      </div>

      {/* Image skeleton */}
      <div className="w-full aspect-square bg-gray-800/60" />

      {/* Actions skeleton */}
      <div className="p-5">
        <div className="flex space-x-4 mb-3">
          <div className="h-8 w-16 bg-gray-800/60 rounded" />
          <div className="h-8 w-16 bg-gray-800/60 rounded" />
        </div>
        <div className="h-4 bg-gray-800/60 rounded w-full mb-2" />
        <div className="h-4 bg-gray-800/60 rounded w-3/4" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800/60 p-6 animate-pulse">
      {/* Avatar skeleton */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-800/60" />
        <div className="flex-1">
          <div className="h-6 bg-gray-800/60 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-800/60 rounded w-32 mb-3" />
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-800/60 rounded w-20" />
            <div className="h-4 bg-gray-800/60 rounded w-20" />
          </div>
        </div>
      </div>

      {/* Bio skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-800/60 rounded w-full" />
        <div className="h-3 bg-gray-800/60 rounded w-5/6" />
      </div>

      {/* Stats skeleton */}
      <div className="flex space-x-6">
        <div className="h-12 bg-gray-800/60 rounded flex-1" />
        <div className="h-12 bg-gray-800/60 rounded flex-1" />
        <div className="h-12 bg-gray-800/60 rounded flex-1" />
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800/60 p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-full bg-gray-800/60" />
        <div className="flex-1">
          <div className="h-5 bg-gray-800/60 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-800/60 rounded w-full mb-3" />
          <div className="flex space-x-4 mb-3">
            <div className="h-3 bg-gray-800/60 rounded w-20" />
            <div className="h-3 bg-gray-800/60 rounded w-20" />
          </div>
          <div className="h-10 bg-gray-800/60 rounded w-full" />
        </div>
      </div>
    </div>
  )
}
