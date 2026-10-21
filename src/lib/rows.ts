/**
 * Tira de cada fileira os filmes que já apareceram numa fileira anterior, para o mesmo filme
 * não se repetir em Ação, Comédia e Aventura. A primeira fileira que tem o filme fica com ele.
 */
export function dedupeMovieRows<T extends { id: number }>(rows: T[][]): T[][] {
  const seen = new Set<number>();
  return rows.map((row) =>
    row.filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    }),
  );
}
