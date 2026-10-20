import type { Metadata } from "next";
import { MarkedMoviesPage } from "@/app/_listas/MarkedMoviesPage";

export const metadata: Metadata = { title: "Quero assistir" };

export default function Page() {
  return <MarkedMoviesPage status="quero_assistir" />;
}
