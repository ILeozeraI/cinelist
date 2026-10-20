"use client";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="page-top mx-auto max-w-md px-4 pb-20 text-center">
      <h1 className="mt-12 font-display text-5xl leading-none font-extrabold uppercase">Algo deu errado</h1>
      <p className="mt-2 text-penumbra">Não conseguimos falar com o catálogo de filmes agora.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-md bg-projetor px-6 py-2.5 text-sm font-semibold text-sala hover:bg-projetor-claro"
      >
        Tentar de novo
      </button>
    </div>
  );
}
