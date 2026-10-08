"use client";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-zinc-400">Não conseguimos falar com o catálogo de filmes agora.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300"
      >
        Tentar de novo
      </button>
    </div>
  );
}
