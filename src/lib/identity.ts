// src/lib/identity.ts
import netlifyIdentity from "netlify-identity-widget";

/**
 * Inicializa o Netlify Identity apontando para o endpoint local em dev
 * (http://localhost:8888/.netlify/identity). Em produção, o origin do site
 * no Netlify também expõe esse endpoint.
 */
export function initIdentity() {
  const APIUrl = `${window.location.origin}/.netlify/identity`;
  netlifyIdentity.on("error", (e) => console.error("Identity error:", e));
  netlifyIdentity.init({ APIUrl }); // força a URL correta
  return netlifyIdentity;
}

export function currentUser() {
  return netlifyIdentity.currentUser();
}

export async function requireToken(): Promise<{ email: string; token: string }> {
  const u = netlifyIdentity.currentUser();
  if (!u) throw new Error("Não logado");
  const token = await u.jwt();
  const email = u.email || "";
  return { email, token };
}
