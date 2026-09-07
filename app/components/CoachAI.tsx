"use client";
import { useEffect, useRef, useState } from 'react';
import { professions, settings, type Choice } from '../lib/alba';
import { type CatalogGame } from '../lib/catalog';
import { byId, findGames, localTurn, newSession, planCheck, restoreSession, sessionKey, understand, type Session } from '../lib/coach';
type Props = { context: Choice; recommendations: CatalogGame[]; excludedIds: string[]; favorites?:string[]; toggleFavorite?:(id:string)=>void };
export function CoachAI({ context, excludedIds, favorites=[], toggleFavorite }: Props) {
  const [open,setOpen]=useState(false), [settingsOpen,setSettingsOpen]=useState(false);
  const [state,setState]=useState<Session>(()=>newSession(context));
  const [ready,setReady]=useState(false), [storageNotice,setStorageNotice]=useState('');
  const [apiKey,setApiKey]=useState(''), [model,setModel]=useState('gpt-5.6-luna');
  const [prompt,setPrompt]=useState(''), [tab,setTab]=useState('Chat'), [workTab,setWorkTab]=useState('Spiele');
  const [busy,setBusy]=useState(false), [status,setStatus]=useState(''), [partial,setPartial]=useState('');
  const [error,setError]=useState(''), [authError,setAuthError]=useState(false), [retry,setRetry]=useState('');
  const dialog=useRef<HTMLDivElement>(null), end=useRef<HTMLDivElement>(null);
  const requestId=useRef(0), controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    try {
      const saved=sessionStorage.getItem(sessionKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(saved)setState(restoreSession(saved));
      setApiKey(sessionStorage.getItem('albathek-openai-key')??'');
      setModel(sessionStorage.getItem('albathek-openai-model')??'gpt-5.6-luna');
    }catch{setStorageNotice('Sitzungsspeicher nicht verfügbar oder ungültig. Dieses Gespräch bleibt nur im Arbeitsspeicher.');}
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try{sessionStorage.setItem(sessionKey,JSON.stringify(state));}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    catch{setStorageNotice('Browserspeicher nicht verfügbar oder voll. Das Gespräch bleibt im Arbeitsspeicher.');}
  },[state,ready]);
  useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[state.messages,partial,open]);
  useEffect(()=>{
    if(!open)return;
    const before=document.activeElement as HTMLElement, overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const frame=requestAnimationFrame(()=>dialog.current?.querySelector('textarea')?.focus());
    function keyboard(e:KeyboardEvent){
      if(e.key==='Escape')setOpen(false);
      if(e.key!=='Tab')return;
      const els=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,input,select,a[href],summary')??[]).filter(el=>el.getClientRects().length);
      if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1)?.focus();}
      else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0]?.focus();}
    }
    window.addEventListener('keydown',keyboard);
    return()=>{cancelAnimationFrame(frame);document.body.style.overflow=overflow;window.removeEventListener('keydown',keyboard);before?.focus();};
  },[open]);
  function cancel(){requestId.current++;controller.current?.abort();setBusy(false);setPartial('');setStatus('');}
  function saveSettings(){cancel();try{sessionStorage.setItem('albathek-openai-key',apiKey.trim());sessionStorage.setItem('albathek-openai-model',model);}catch{setStorageNotice('Einstellungen bleiben nur im Arbeitsspeicher.');}setSettingsOpen(false);}
  async function send(text:string){
    text=text.trim();if(!text||busy)return;
    setPrompt('');setError('');setAuthError(false);setRetry(text);
    if(!apiKey.trim()){setState(localTurn(state,text,excludedIds));return;}
    const base=structuredClone(state), current=++requestId.current;
    const visible=structuredClone(base);visible.group=understand(text,visible.group);
    if(!/^(warum|wieso|erklär|wie|was)/i.test(text))visible.resultIds=findGames(visible.group,text,excludedIds).slice(0,6).map(g=>g.id);
    visible.messages.push({role:'user',text});setState(visible);setBusy(true);setPartial('');setStatus('Coach liest deine Nachricht …');
    const abort=new AbortController();controller.current=abort;
    try{
      const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text,apiKey:apiKey.trim(),model,state:base,excludedIds}),signal:AbortSignal.any([abort.signal,AbortSignal.timeout(90000)])});
      if(!response.ok){const data=await response.json();setAuthError(response.status===401||response.status===403);throw Error(data.error||'Anfrage fehlgeschlagen.');}
      if(!response.body)throw Error('Die Antwort konnte nicht gelesen werden.');
      const reader=response.body.getReader(), decoder=new TextDecoder();let buffer='',finished=false;
      while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()!;
        for(const line of lines){if(!line.trim())continue;const event=JSON.parse(line);if(current!==requestId.current)return;
          if(event.type==='status')setStatus(event.text);
          if(event.type==='delta')setPartial(p=>p+event.text);
          if(event.type==='error'){setAuthError(event.auth===true);throw Error(event.text);}
          if(event.type==='done'){setState(event.state);if(event.state.plans.length>base.plans.length)setWorkTab('Einheit');setPartial('');finished=true;}
        }
      }
      if(!finished)throw Error('Antwort unterbrochen. Dein bisheriger Plan bleibt erhalten.');
    }catch(e){if(current===requestId.current){setError((e as Error).name==='TimeoutError'?'Zeitüberschreitung. Dein bisheriger Plan bleibt erhalten.':(e as Error).message);setPartial('');}}
    finally{if(current===requestId.current){setBusy(false);setStatus('');}}
  }
  function reset(all:boolean){if(all&&!window.confirm('Das gesamte Coach-Gespräch und alle Planstände dieser Sitzung löschen?'))return;cancel();setError('');setRetry('');setWorkTab('Spiele');setState(all?newSession(context):{...state,plans:[],messages:[...state.messages,{role:'assistant',text:'Neue Einheit: Der Plan ist leer. Deine Gruppendaten bleiben erhalten.'}]});}
  function openCoach(){if(!state.messages.length)setState(newSession(context));setOpen(true);}
  const plan=state.plans.at(-1), group=state.group;
  const suggestions=plan?['Warum passt Spiel 2?','Erklär mir den Aufbau von Spiel 2.','Ersetze den Einstieg durch etwas Ruhigeres.']:state.resultIds.length?['Wir haben nur einen Ball.','Mach daraus eine Einheit für 30 Minuten.','Erklär mir den Aufbau von Spiel 2.']:['11 Kinder, meist Fußballer, Ball.','6 Kinder, 5 Jahre, Bewegungsraum, 15 Minuten'];
  // ALBA remote thumbnails retain their original source; no image proxy is used.
  /* eslint-disable @next/next/no-img-element */
  function card(id:string,index:number){const g=byId.get(id);return g&&<article className="dialog-game" key={id}><img src={g.image} alt="" loading="lazy"/><div><small>SPIEL {index+1} · {g.kind}</small><h3>{g.title}</h3><p>{g.description}</p><p className="dialog-muted">Material: {g.materials||'Nicht dokumentiert – bitte im Original prüfen.'}</p><a href={g.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a>{toggleFavorite&&<button className="dialog-save" aria-pressed={favorites.includes(id)} onClick={()=>toggleFavorite(id)}>{favorites.includes(id)?'♥ Gemerkt':'♡ Merken'}</button>}</div></article>;}
  return <>
    <section className="coach-launch" id="coach-ai"><div><p className="eyebrow">DEIN ALBA-COACH</p><h2>Gemeinsam zur passenden Einheit.</h2><p>Spiele finden, nachfragen und deinen Plan Schritt für Schritt verbessern.</p><button className="primary" onClick={openCoach}>Mit dem Coach sprechen ↗</button></div></section>
    <button className="coach-fab" aria-label="Coach AI öffnen" onClick={openCoach}>✦ COACH AI</button>
    {open&&<div className="dialog-overlay" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="coach-title"><div className="dialog-shell">
      <header className="dialog-header"><div><strong id="coach-title">ALBA<span>thek</span> · Coach</strong><small>{apiKey.trim()?'KI-Dialog · OpenAI':'Ohne KI · Basissuche & Planung'}</small></div><div><button onClick={()=>setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}>⚙ OpenAI</button><button onClick={()=>setOpen(false)} aria-label="Coach AI schließen">✕</button></div></header>
      {settingsOpen&&<form className="dialog-settings" onSubmit={e=>{e.preventDefault();saveSettings();}}><label>OpenAI API-Key<input type="password" autoComplete="off" value={apiKey} onChange={e=>setApiKey(e.target.value)}/></label><label>Modell<select value={model} onChange={e=>setModel(e.target.value)}>{['gpt-5.6-luna','gpt-5.6-terra','gpt-5.6','gpt-5-mini'].map(m=><option key={m}>{m}</option>)}</select></label><p>Schlüssel und Gespräch bleiben in dieser Browsersitzung. Für KI-Antworten werden Gespräch und passende Katalogdaten an OpenAI übertragen. Bitte keine personenbezogenen Daten von Kindern eingeben.</p><button type="submit">Speichern</button><button type="button" onClick={()=>{cancel();setApiKey('');try{sessionStorage.removeItem('albathek-openai-key');}catch{/* in-memory fallback */}}}>Schlüssel entfernen</button></form>}
      <div className="dialog-context"><span>{settings[group.choice.setting]} · {group.choice.age} Jahre</span><span>{group.choice.children} Kinder</span><span>{group.choice.duration} Min.</span><span>{group.choice.room}</span>{group.interests.map(x=><span key={x}>{x}</span>)}{group.ballPresent&&<span>{group.balls===null?'Ball · Anzahl offen':`${group.balls} Ball${group.balls===1?'':'e'}`}</span>}<span>{professions[group.choice.profession]}</span></div>
      {storageNotice&&<p role="status" className="dialog-notice">{storageNotice}</p>}
      <nav className="dialog-tabs" aria-label="Coach-Arbeitsbereich">{['Chat','Spiele','Einheit'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}{t==='Spiele'?` (${state.resultIds.length})`:''}</button>)}</nav>
      <div className="dialog-body" data-tab={tab} data-work-tab={workTab}>
        <section className="dialog-chat" aria-label="Gespräch"><div className="dialog-messages" role="log" aria-live="polite"><div className="dialog-bubble assistant"><small>DEIN COACH</small><p>Was braucht eure Gruppe heute? Beschreibe eure Situation. Wir finden zuerst Spiele – eine Einheit bauen wir auf deinen Wunsch.</p></div>{state.messages.map((m,i)=><div className={`dialog-bubble ${m.role}`} key={i}><small>{m.role==='user'?'DU':apiKey?'COACH':'REGELBASIERTE HILFE'}</small><p>{m.text}</p></div>)}{partial&&<div className="dialog-bubble assistant"><p>{partial}</p></div>}<div ref={end}/></div>
          <div className="dialog-composer">{error&&<div role="alert" className="dialog-error">{error} {authError&&<button onClick={()=>setSettingsOpen(true)}>OpenAI-Einstellungen</button>}<button disabled={busy} onClick={()=>{setState(s=>({...s,messages:s.messages.at(-1)?.role==='user'?s.messages.slice(0,-1):s.messages}));setPrompt(retry);setError('');}}>Nachricht erneut bearbeiten</button></div>}
            {busy?<div role="status">{status} <button onClick={()=>{cancel();setError('Abgebrochen. Bisherige Ergebnisse bleiben erhalten.');}}>Abbrechen</button></div>:<div className="dialog-suggestions">{suggestions.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div>}
            <form onSubmit={e=>{e.preventDefault();send(prompt);}}><label className="sr-only" htmlFor="coach-message">Nachricht an den Coach</label><textarea id="coach-message" placeholder="Frag nach oder passe eure Einheit an …" value={prompt} maxLength={1600} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(prompt);}}}/><button disabled={busy||!prompt.trim()} type="submit">Senden ↑</button></form><small>Enter senden · Shift + Enter neue Zeile</small>
          </div></section>
        <section className="dialog-work" aria-label="Spiele und Einheit"><div className="dialog-work-tabs">{['Spiele','Einheit'].map(t=><button key={t} aria-pressed={workTab===t} onClick={()=>setWorkTab(t)}>{t}</button>)}</div><div className="dialog-work-actions"><button onClick={()=>reset(false)} disabled={busy}>Neue Einheit</button><button onClick={()=>reset(true)}>Neues Gespräch</button></div>
          <div className="dialog-results"><h2>Passende Spielideen <small>{state.resultIds.length} / 657</small></h2>{!state.resultIds.length&&<p>Deine Treffer erscheinen hier. Alle öffentlichen Spiele bleiben durchsuchbar; Testprofile sind nur bei aktivierter Auswahl beteiligt.</p>}{state.resultIds.map(card)}</div>
          <div className="dialog-plan"><h2>Eure Einheit</h2>{plan?<><p>{plan.headline}</p>{planCheck(state).map(w=><p className="dialog-notice" key={w}>{w}</p>)}{plan.timeline.map((item,i)=><article className="dialog-plan-step" key={`${i}-${item.gameId}`}><small>{item.duration} MIN · {item.phase}</small><h3>{item.title}</h3><p>{item.reason}</p><p className="dialog-muted">{item.tip}</p><a href={byId.get(item.gameId)!.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a></article>)}<p className="dialog-muted">{plan.read}</p><p>{plan.coachNote}</p>{plan.warnings.map(w=><p className="dialog-muted" key={w}>{w}</p>)}<button disabled={busy||state.plans.length<2} onClick={()=>setState(s=>({...s,plans:s.plans.slice(0,-1),turns:[],messages:[...s.messages,{role:'assistant',text:'Änderung zurückgenommen. Der vorherige Planstand ist wieder aktiv.'}]}))}>Änderung zurücknehmen</button><button onClick={()=>window.print()}>Spielplan drucken</button></>:<p>Noch kein Plan. Bitte den Coach, aus den Treffern eine Einheit zu bauen.</p>}</div>
        </section>
      </div>
    </div></div>}
  </>;
}
