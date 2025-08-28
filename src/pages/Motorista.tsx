import React, { useEffect, useState } from "react";
import { requireToken } from "../lib/identity";
import { api } from "../lib/api";

type Assign = { id:string; label:string; vehicle_plate?:string; campaign_title?:string };

export default function Motorista(){
  const [assignments,setAssignments]=useState<Assign[]|null>(null);
  const [cvId,setCvId]=useState(""); const [km,setKm]=useState(""); const [notes,setNotes]=useState("");
  const [lat,setLat]=useState<number|null>(null); const [lng,setLng]=useState<number|null>(null);
  const [left,setLeft]=useState<File|null>(null); const [right,setRight]=useState<File|null>(null);
  const [rear,setRear]=useState<File|null>(null); const [front,setFront]=useState<File|null>(null);
  const [plate,setPlate]=useState<File|null>(null); const [odo,setOdo]=useState<File|null>(null);
  const [sending,setSending]=useState(false); const [ok,setOk]=useState(""); const [err,setErr]=useState("");

  useEffect(()=>{ if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(p=>{ setLat(p.coords.latitude); setLng(p.coords.longitude); }, ()=>{}, {enableHighAccuracy:true, timeout:10000});
  } },[]);

  async function load(){
    try{
      const { token } = await requireToken();
      const res = await api("list-assignments", token);
      setAssignments(res.items || []);
      if ((res.items||[]).length>0) setCvId(res.items[0].id);
    }catch(e:any){ setAssignments([]); setErr(e.message); }
  }
  useEffect(()=>{ load(); },[]);

  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setErr(""); setOk("");
    if(!cvId) return setErr("Selecione uma campanha/veículo.");
    if(!left || !right || !rear || !plate || !odo) return setErr("Fotos obrigatórias: lados, traseira, placa, odômetro.");

    function toDataUrl(f:File|null){ return new Promise<string|undefined>(res=>{ if(!f) return res(undefined); const fr=new FileReader(); fr.onload=()=>res(String(fr.result)); fr.readAsDataURL(f); }); }
    const photos = [
      { angle:"lado_esq", dataUrl: await toDataUrl(left) },
      { angle:"lado_dir", dataUrl: await toDataUrl(right) },
      { angle:"traseira", dataUrl: await toDataUrl(rear) },
      ...(front ? [{ angle:"dianteira", dataUrl: await toDataUrl(front) }] : []),
      { angle:"placa", dataUrl: await toDataUrl(plate) },
      { angle:"odometro", dataUrl: await toDataUrl(odo) }
    ].filter(p=>p.dataUrl);

    try{
      setSending(true);
      const { token } = await requireToken();
      const vehicleLabel = (assignments||[]).find(a=>a.id===cvId)?.label || "";
      const vehicle_plate = vehicleLabel.split("—")[0].trim();
      const resp = await api("create-event", token, {
        assignment_id: cvId, vehicle_plate, type:"INSTALL",
        km: km?Number(km):null, lat, lng, notes, photos
      });
      setOk(`Check-in salvo! Fotos: ${(resp.photos||[]).length}`);
      setKm(""); setNotes(""); setLeft(null); setRight(null); setRear(null); setFront(null); setPlate(null); setOdo(null);
      (document.getElementById("f-left") as HTMLInputElement).value = "";
      (document.getElementById("f-right") as HTMLInputElement).value = "";
      (document.getElementById("f-rear") as HTMLInputElement).value = "";
      (document.getElementById("f-front") as HTMLInputElement).value = "";
      (document.getElementById("f-plate") as HTMLInputElement).value = "";
      (document.getElementById("f-odo") as HTMLInputElement).value = "";
    }catch(e:any){ setErr(e.message||"Erro ao salvar"); }
    finally{ setSending(false); }
  }

  async function createDemo(){
    try{
      const { token } = await requireToken();
      await api("create-demo-assignment", token, {});
      await load();
    }catch(e:any){ setErr(e.message); }
  }

  return (
    <section className="card">
      <h2>Motorista — Check-in (Instalação)</h2>
      {assignments===null ? <p>Carregando...</p> :
       assignments.length===0 ? <div className="grid"><button onClick={createDemo}>Criar campanha demo</button></div> :
      <form onSubmit={onSubmit} className="grid">
        <label>Campanha / Veículo
          <select value={cvId} onChange={e=>setCvId(e.target.value)}>
            {(assignments||[]).map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        <div className="grid g2">
          <label>Quilometragem (km)<input value={km} onChange={e=>setKm(e.target.value)} type="number" inputMode="decimal"/></label>
          <label>Observações<input value={notes} onChange={e=>setNotes(e.target.value)} /></label>
        </div>

        <div className="grid g2">
          <div><span className="muted">Lado esquerdo *</span>
            <label className="btn"><input id="f-left" type="file" accept="image/*" capture="environment" hidden onChange={e=>setLeft(e.target.files?.[0]??null)} /> Tirar foto</label>
          </div>
          <div><span className="muted">Lado direito *</span>
            <label className="btn"><input id="f-right" type="file" accept="image/*" capture="environment" hidden onChange={e=>setRight(e.target.files?.[0]??null)} /> Tirar foto</label>
          </div>
          <div><span className="muted">Traseira *</span>
            <label className="btn"><input id="f-rear" type="file" accept="image/*" capture="environment" hidden onChange={e=>setRear(e.target.files?.[0]??null)} /> Tirar foto</label>
          </div>
          <div><span className="muted">Dianteira (opcional)</span>
            <label className="btn"><input id="f-front" type="file" accept="image/*" capture="environment" hidden onChange={e=>setFront(e.target.files?.[0]??null)} /> Tirar foto</label>
          </div>
          <div><span className="muted">Placa *</span>
            <label className="btn"><input id="f-plate" type="file" accept="image/*" capture="environment" hidden onChange={e=>setPlate(e.target.files?.[0]??null)} /> Tirar foto</label>
          </div>
          <div><span className="muted">Odômetro *</span>
            <label className="btn"><input id="f-odo" type="file" accept="image/*" capture="environment" hidden onChange={e=>setOdo(e.target.files?.[0]??null)} /> Tirar foto</label>
          </div>
        </div>

        <div className="muted">GPS: {lat?.toFixed(5) ?? "?"}, {lng?.toFixed(5) ?? "?"}</div>
        <button disabled={sending}>{sending? "Enviando..." : "Registrar Check-in"}</button>
        {ok && <p style={{color:"#059669"}}>{ok}</p>}
        {err && <p style={{color:"#dc2626"}}>{err}</p>}
      </form>}
    </section>
  );
}