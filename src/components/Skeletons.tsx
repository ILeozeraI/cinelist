/** Fileiras cinza no lugar das fileiras da Início enquanto elas carregam. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando filmes" className="space-y-10 md:space-y-14">
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className="animate-pulse">
          <div className="shell">
            <div className="h-7 w-44 rounded bg-poltrona md:h-8" />
          </div>
          <div className="flex gap-3 overflow-hidden px-(--gutter) pt-2 pb-5 md:gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="w-[38vw] max-w-44 shrink-0 sm:w-40 md:w-44 md:max-w-none xl:w-48 2xl:w-52">
                <div className="aspect-[2/3] rounded-md bg-poltrona" />
                <div className="mt-2.5 h-4 w-3/4 rounded bg-poltrona" />
                <div className="mt-1 h-3 w-1/2 rounded bg-poltrona" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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
