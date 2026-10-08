import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <Link href="/" className="mt-6 inline-block text-yellow-400 hover:underline">
        Voltar para o Início
      </Link>
    </div>
  );
}
