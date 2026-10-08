import Link from "next/link";

export default function MovieNotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Filme não encontrado</h1>
      <p className="mt-2 text-zinc-400">O link pode estar errado ou o filme saiu do catálogo.</p>
      <Link href="/" className="mt-6 inline-block text-yellow-400 hover:underline">
        Voltar para o Início
      </Link>
    </div>
  );
}
