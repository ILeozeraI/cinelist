"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/auth-actions";
import { loginHref } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const PERSONAL_TABS = ["/quero-assistir", "/ja-assisti"];

// undefined = ainda não sabemos; null = sem sessão.
type Email = string | null | undefined;

// Caminho com a busca (?q=…): usePathname não traz a query e useSearchParams tiraria o layout do estático.
function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function AccountMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<Email>(undefined);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [returnTo, setReturnTo] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);

  // O cabeçalho vive no layout raiz (estático): a sessão é lida aqui, no navegador.
  // Reler a cada página é como ele percebe o login feito pela Server Action.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    const first = supabase ? supabase.auth.getSession().then(({ data }) => data.session?.user.email ?? null) : Promise.resolve(null);
    first.then((value) => {
      if (!active) return;
      setReturnTo(currentPath());
      setEmail(value);
    });
    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      if (active) setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  async function handleSignOut() {
    if (leaving) return;
    setLeaving(true);
    try {
      await signOut();
    } catch {
      // A chamada nem chegou ao servidor: a sessão continua e o Sair volta a funcionar.
      return;
    } finally {
      setLeaving(false);
    }
    setOpen(false);
    setEmail(null);
    // Recarregar de verdade: os botões de marcar guardam o estado de quem saiu.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a recarga completa é proposital
    if (PERSONAL_TABS.some((tab) => pathname.startsWith(tab))) window.location.assign("/");
    else window.location.reload();
  }

  if (email === undefined) return <span aria-hidden className="inline-block h-9 w-20 shrink-0" />;

  if (email === null) {
    // Na própria /entrar o link trocaria o voltar que já está lá.
    if (pathname.startsWith("/entrar")) return null;
    const href = loginHref(returnTo);
    return (
      <Link
        href={href}
        onNavigate={(event) => {
          // A busca pode ter mudado sem trocar de página (/buscar?q=…): usa a URL do momento do clique.
          const fresh = loginHref(currentPath());
          if (fresh === href) return;
          event.preventDefault();
          router.push(fresh);
        }}
        className="inline-flex h-9 shrink-0 items-center rounded-full border border-projetor px-4 text-sm font-medium text-projetor transition-colors hover:bg-projetor hover:text-sala focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor"
      >
        Entrar
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-sm text-tela/90 transition-colors hover:border-projetor hover:text-tela focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor"
      >
        <span className="max-w-[16ch] truncate md:max-w-[28ch]">{email}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl bg-poltrona p-1.5 shadow-xl ring-1 ring-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={leaving}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-tela/90 transition-colors hover:bg-white/5 hover:text-tela focus-visible:outline-2 focus-visible:outline-projetor disabled:opacity-60"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
