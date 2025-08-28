import netlifyIdentity from "netlify-identity-widget";
export function initIdentity() {
  netlifyIdentity.init();
  return netlifyIdentity;
}
export function currentUser() {
  return netlifyIdentity.currentUser();
}
export async function requireToken(): Promise<{email:string, token:string}> {
  const u = netlifyIdentity.currentUser();
  if (!u) throw new Error("Não logado");
  const token = await u.jwt();
  const email = u.email || "";
  return { email, token };
}