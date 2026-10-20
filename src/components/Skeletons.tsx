export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando filmes" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-lg bg-poltrona" />
          <div className="mt-2 h-4 w-3/4 rounded bg-poltrona" />
          <div className="mt-1 h-3 w-1/2 rounded bg-poltrona" />
        </div>
      ))}
    </div>
  );
}
