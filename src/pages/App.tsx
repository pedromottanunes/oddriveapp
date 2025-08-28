import React, { useEffect, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { initIdentity, currentUser, requireToken } from "../lib/identity";
import Motorista from "./Motorista";

export default function App(){
  const [ready,setReady]=useState(false);
  const [email,setEmail]=useState<string|null>(null);

  useEffect(()=>{
    initIdentity();
    netlifyIdentity.on("init", user => { setEmail(user?.email ?? null); setReady(true); });
    netlifyIdentity.on("login", user => { setEmail(user?.email ?? null); });
    netlifyIdentity.on("logout", ()=> { setEmail(null); });
  },[]);

  if (!ready) return <main className="center">Carregando...</main>;
  if (!email) {
    return (
      <main className="center">
        <h1>OD Drive — Acompanhamento</h1>
        <p>Faça login para continuar.</p>
        <button onClick={()=>netlifyIdentity.open("login")}>Entrar</button>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="top">
        <h1>OD Drive</h1>
        <div className="spacer" />
        <button onClick={()=>netlifyIdentity.logout()}>Sair</button>
      </header>
      <Motorista />
      <style>{`
        .wrap{max-width:720px;margin:0 auto;padding:16px}
        .top{display:flex;align-items:center;gap:12px}
        .spacer{flex:1}
        .center{min-height:100vh;display:grid;place-items:center;text-align:center;padding:16px}
        button{padding:10px 14px;border-radius:8px;border:0;background:#0ea5e9;color:#fff}
        input,select{width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1}
        .grid{display:grid;gap:12px}
        .g2{grid-template-columns:1fr 1fr}
        .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px}
        img.preview{max-width:220px;border:1px solid #e2e8f0;border-radius:8px}
      `}</style>
    </main>
  );
}