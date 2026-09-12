export default function Loading() {
  return (
    <div className="container-page py-12">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-lg bg-graphite-800/10" />
            <div className="mt-3 h-4 w-3/4 rounded bg-graphite-800/10" />
            <div className="mt-2 h-4 w-1/3 rounded bg-graphite-800/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
