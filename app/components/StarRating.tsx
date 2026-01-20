'use client'

interface StarRatingProps {
  rating: number  // 0-5, can be decimal
  count?: number  // number of reviews
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, count, size = 'md' }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating)
          const partial = star === Math.ceil(rating) && rating % 1 !== 0
          const percentage = partial ? (rating % 1) * 100 : 0

          return (
            <div key={star} className={`relative ${sizeClasses[size]}`}>
              {/* Empty star (background) */}
              <svg
                className={`${sizeClasses[size]} text-gray-300`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {/* Filled star (overlay) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : partial ? `${percentage}%` : '0%' }}
              >
                <svg
                  className={`${sizeClasses[size]} text-yellow-400`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>
      {count !== undefined && (
        <span className={`text-gray-500 ${textSizes[size]}`}>
          ({count})
        </span>
      )}
    </div>
  )
}
