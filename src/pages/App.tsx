// src/pages/App.tsx
import React, { useEffect, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { initIdentity } from "../lib/identity";
import Motorista from "./Motorista";

export default function App() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const id = netlifyIdentity;

    const onInit = (user: any) => {
      setEmail(user?.email ?? null);
      setReady(true);
    };
    const onLogin = (user: any) => setEmail(user?.email ?? null);
    const onLogout = () => setEmail(null);

    // 1) Registra listeners ANTES do init
    id.on("init", onInit);
    id.on("login", onLogin);
    id.on("logout", onLogout);

    // 2) Inicializa apontando para /.netlify/identity (definido em initIdentity)
    initIdentity();

    // 3) Fallback: se por algum motivo o evento "init" não vier, seguimos em 1.5s
    const t = setTimeout(() => setReady(true), 1500);

    return () => {
      clearTimeout(t);
      id.off("init", onInit);
      id.off("login", onLogin);
      id.off("logout", onLogout);
    };
  }, []);

  if (!ready) return <main className="center">Carregando...</main>;

  if (!email) {
    return (
      <main className="center">
        <h1>OD Drive — Acompanhamento</h1>
        <p>Faça login para continuar.</p>
        <button onClick={() => netlifyIdentity.open("login")}>Entrar</button>
        <style>{`
          .center{min-height:100vh;display:grid;place-items:center;text-align:center;padding:16px}
          button{padding:10px 14px;border-radius:8px;border:0;background:#0ea5e9;color:#fff}
        `}</style>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="top">
        <h1>OD Drive</h1>
        <div className="spacer" />
        <button onClick={() => netlifyIdentity.logout()}>Sair</button>
      </header>
      <Motorista />
      <style>{`
        .wrap{max-width:720px;margin:0 auto;padding:16px}
        .top{display:flex;align-items:center;gap:12px}
        .spacer{flex:1}
        button{padding:10px 14px;border-radius:8px;border:0;background:#0ea5e9;color:#fff}
      `}</style>
    </main>
  );
}
