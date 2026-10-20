import type { Metadata } from "next";
import { MarkedMoviesPage } from "@/app/_listas/MarkedMoviesPage";

export const metadata: Metadata = { title: "Já assisti" };

export default function Page() {
  return <MarkedMoviesPage status="ja_assisti" />;
}
