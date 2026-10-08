# Verificação da API do TMDB — 2026-10-08

- Discover com `with_watch_monetization_types=flatrate` + `with_watch_providers=8|119`: 9346 filmes (funciona).
- `/movie/{id}/watch/providers` → `results.BR.flatrate`: funciona (exemplo: A Hipótese do Amor → Amazon Prime Video (119), Amazon Prime Video with Ads (2100)).
- `append_to_response=videos,watch/providers`: chave `watch/providers` presente.

## Streamings por assinatura no Brasil (para `SUBSCRIPTION_PROVIDER_IDS`)

| ID | Nome | Prioridade BR |
|---|---|---|
| 8 | Netflix | 0 |
| 119 | Amazon Prime Video | 1 |
| 350 | Apple TV (a assinatura, antigo Apple TV Plus) | 2 |
| 337 | Disney Plus | 3 |
| 167 | Claro video | 5 |
| 47 | Looke | 6 |
| 531 | Paramount Plus | 7 |
| 1899 | HBO Max | 8 |
| 307 | Globoplay | 10 |
| 283 | Crunchyroll | 11 |
| 11 | MUBI | 12 |
| 19 | NetMovies | 15 |
| 190 | Curiosity Stream | 16 |

Ignorados: lojas de aluguel/compra (2 Apple TV Store, 10 Amazon Video, 3 Google Play Movies), canais gratuitos com anúncios (2285 JustWatch TV, 300 Pluto TV), variantes "Amazon Channel"/"with Ads" e serviços de nicho incertos (447, 484). O ID 350 aparece como "Apple TV" e é a assinatura (nome atual do Apple TV Plus); a loja é o ID 2.
