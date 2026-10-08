export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando filmes" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-3/4 rounded bg-zinc-800" />
          <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
