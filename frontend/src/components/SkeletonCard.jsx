export default function SkeletonCard({ lines = 3, image = true }) {
    return (
      <div className="bg-white rounded shadow p-4 animate-pulse space-y-2">
        {image && (
          <div className="w-full h-48 bg-gray-300 rounded mb-2"></div>
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-gray-200 rounded ${i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'}`}
          />
        ))}
      </div>
    );
  }