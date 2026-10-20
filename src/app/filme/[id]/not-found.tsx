import Link from "next/link";

export default function MovieNotFound() {
  return (
    <div className="page-top mx-auto max-w-md px-4 pb-20 text-center">
      <h1 className="mt-12 font-display text-5xl leading-none font-extrabold uppercase">Filme não encontrado</h1>
      <p className="mt-2 text-penumbra">O link pode estar errado ou o filme saiu do catálogo.</p>
      <Link href="/" className="mt-6 inline-block text-projetor hover:underline">
        Voltar para o Início
      </Link>
    </div>
  );
}
