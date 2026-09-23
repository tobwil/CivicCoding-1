"use client";
import { useEffect, useRef, useState } from 'react';
import { settings, type Choice } from '../lib/alba';
import { kitaPersonas, kitaRooms, isKitaPersona } from '../lib/kita';
import { catalog, type CatalogGame } from '../lib/catalog';
import { actionFor, byId, findGames, localTurn, newSession, planCheck, restoreSession, sessionKey, understand, type Session } from '../lib/coach';
type Props = { onPersonaChange?:(persona:Choice['profession'])=>void; context: Choice; recommendations: CatalogGame[]; excludedIds: string[]; favorites?:string[]; toggleFavorite?:(id:string)=>void };
export function CoachAI({ onPersonaChange, context, excludedIds, favorites=[], toggleFavorite }: Props) {
  const [open,setOpen]=useState(false), [settingsOpen,setSettingsOpen]=useState(false);
  const [state,setState]=useState<Session>(()=>newSession(context));
  const [ready,setReady]=useState(false), [storageNotice,setStorageNotice]=useState('');
  const [apiKey,setApiKey]=useState(''), [model,setModel]=useState('gpt-5.6-luna');
  const [theme,setTheme]=useState('');
  const [prompt,setPrompt]=useState(''), [tab,setTab]=useState('Chat'), [workTab,setWorkTab]=useState('Spiele');
  const [busy,setBusy]=useState(false), [status,setStatus]=useState(''), [partial,setPartial]=useState('');
  const [error,setError]=useState(''), [authError,setAuthError]=useState(false), [retry,setRetry]=useState('');
  const dialog=useRef<HTMLDivElement>(null), end=useRef<HTMLDivElement>(null);
  const requestId=useRef(0), controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    try {
      const saved=sessionStorage.getItem(sessionKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(saved){const restored=restoreSession(saved);setState(restored);if(restored.plans.length)setWorkTab('Einheit');}
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
  useEffect(()=>{const log=dialog.current?.querySelector('.dialog-messages');if(log)log.scrollTo({top:log.scrollHeight});},[state.messages,partial,open,tab]);
  // View-only navigation: each workspace tab opens at its heading.
  useEffect(()=>{dialog.current?.querySelector('.dialog-work')?.scrollTo({top:0});},[tab,workTab]);
  useEffect(()=>{
    if(!open||!window.visualViewport)return;
    const viewport=window.visualViewport;
    function fitKeyboard(){
      const el=dialog.current;if(!el)return;
      el.style.setProperty('--coach-viewport-height',`${viewport.height}px`);
      el.style.top=`${viewport.offsetTop}px`;
      el.dataset.keyboard=String(viewport.height<window.innerHeight*.75);
    }
    fitKeyboard();viewport.addEventListener('resize',fitKeyboard);viewport.addEventListener('scroll',fitKeyboard);
    return()=>{viewport.removeEventListener('resize',fitKeyboard);viewport.removeEventListener('scroll',fitKeyboard);};
  },[open]);
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
    if(!apiKey.trim()){try{setState(localTurn(state,text,excludedIds));}catch(e){setError((e as Error).message);}return;}
    const base=structuredClone(state), current=++requestId.current;
    const visible=structuredClone(base);try{visible.group=understand(text,visible.group);}catch(e){setError((e as Error).message);return;}
    if(actionFor(text,base).kind!=='explanation')visible.resultIds=findGames(visible.group,text,excludedIds).slice(0,6).map(g=>g.id);
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
  function openCoach(){if(!state.messages.length)setState(newSession(context));else if(state.group.choice.profession!==context.profession){setState(s=>{const group={...s.group,choice:{...s.group.choice,profession:context.profession}};return {...s,group,turns:[],resultIds:findGames(group,'',excludedIds).slice(0,6).map(g=>g.id)};});}setOpen(true);}
  const plan=state.plans.at(-1), group=state.group;
  const hasWorkspace=state.resultIds.length>0||!!plan, isWelcome=!state.messages.length;
  const suggestionLabels=plan?['Warum Spiel 2?','Spiel 2 erklären','Ruhigerer Einstieg']:state.resultIds.length?['Spiel 1 auswählen','Spiel 2 erklären','Freie 30-Minuten-Einheit']:['Kita · gemeinsam in Bewegung','Kita · kurze Bewegungspause'];
  const suggestions=plan?['Warum passt Spiel 2?','Erklär mir den Aufbau von Spiel 2.','Ersetze den Einstieg durch etwas Ruhigeres.']:state.resultIds.length?['Ich wähle Spiel 1.','Erklär mir den Aufbau von Spiel 2.','Mach daraus eine freie Einheit für 30 Minuten.']:['10 Kinder in der Kita, 4–5 Jahre, 20 Minuten in der Sporthalle. Zeig uns Spiele mit wenig Vorbereitung.','6 Kinder, 5 Jahre, Bewegungsraum, 15 Minuten'];
  // ALBA remote thumbnails retain their original source; no image proxy is used.
  /* eslint-disable @next/next/no-img-element */
  function card(id:string,index:number){const g=byId.get(id);return g&&<article className="dialog-game" key={id}>{g.image&&<img src={g.image} alt="" loading="lazy"/>}<div><small>Spiel {index+1} · {g.kind}</small><h3>{g.title}</h3></div><div className="dialog-game-content"><p>{g.description}</p><p className="dialog-muted"><strong>Material</strong> · {g.materials||'Nicht dokumentiert – bitte im Original prüfen.'}</p><div className="dialog-card-actions">{g.href&&<a href={g.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a>}<button disabled={busy} onClick={()=>send(`Ich wähle Spiel ${index+1}.`)}>Dieses Spiel auswählen</button>{toggleFavorite&&<button className="dialog-save" aria-pressed={favorites.includes(id)} onClick={()=>toggleFavorite(id)}>{favorites.includes(id)?'♥ Gemerkt':'♡ Merken'}</button>}</div></div></article>;}
  return <>
    <section className="coach-launch" id="coach-ai"><div><p className="eyebrow">DEIN ALBA-COACH</p><h2>Ein Spiel. Eure Themenwelt.</h2><p>KITA-Spiele finden, auswählen und im Gespräch in eine Bewegungsgeschichte einbetten.</p><button className="primary" onClick={openCoach}>Mit dem Coach sprechen ↗</button></div></section>
    <button className="coach-fab" aria-label="Coach AI öffnen" onClick={openCoach}>✦ COACH AI</button>
    {open&&<div className="dialog-overlay" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="coach-title"><div className="dialog-shell">
      <header className="dialog-header">
        <div className="dialog-brand"><strong id="coach-title">ALBA<span>thek</span><span className="dialog-brand-coach">Coach</span></strong><small>{apiKey.trim()?'KI-Dialog':'Basissuche · ohne KI'}</small></div>
        <div className="dialog-header-actions">
          <button onClick={()=>reset(true)} aria-label="Neues Gespräch" title="Neues Gespräch"><svg className="dialog-new-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 7M19 3v5h-5"/></svg><span>Neues Gespräch</span></button>
          <button onClick={()=>setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen} aria-label="OpenAI-Einstellungen" title="OpenAI-Einstellungen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m9 3-.6 2-2 .9-2-.4-2 3.5 1.4 1.6v2.8L2.4 15l2 3.5 2-.4 2 .9.6 2h4l.6-2 2-.9 2 .4 2-3.5-1.4-1.6v-2.8L20.6 9l-2-3.5-2 .4-2-.9L14 3Z"/><circle cx="11.5" cy="12" r="3"/></svg><span>Einstellungen</span></button>
          <button onClick={()=>setOpen(false)} aria-label="Coach AI schließen" title="Coach schließen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
      </header>
      {settingsOpen&&<form className="dialog-settings" onSubmit={e=>{e.preventDefault();saveSettings();}}><label>OpenAI API-Key<input type="password" autoComplete="off" value={apiKey} onChange={e=>setApiKey(e.target.value)}/></label><label>Modell<select value={model} onChange={e=>setModel(e.target.value)}>{['gpt-5.6-luna','gpt-5.6-terra','gpt-5.6','gpt-5-mini'].map(m=><option key={m}>{m}</option>)}</select></label><p>Schlüssel und Gespräch bleiben in dieser Browsersitzung. Für KI-Antworten werden Gespräch und passende Katalogdaten an OpenAI übertragen. Bitte keine personenbezogenen Daten von Kindern eingeben.</p><button type="submit">Speichern</button><button type="button" onClick={()=>{cancel();setApiKey('');try{sessionStorage.removeItem('albathek-openai-key');}catch{/* in-memory fallback */}}}>Schlüssel entfernen</button></form>}
      <div className="dialog-context"><div><span>{settings[group.choice.setting]} · {group.choice.age} Jahre</span><span>{group.choice.children} Kinder</span><span>{group.choice.duration} Min.</span><span>{kitaRooms[group.choice.room]}</span>{group.interests.map(x=><span key={x}>{x}</span>)}{group.ballPresent&&<span>{group.balls===null?'Ball · Anzahl offen':`${group.balls} ${group.balls===1?'Ball':'Bälle'}`}</span>}</div><label>Dein Profil <select aria-label="Coach-Persona" value={group.choice.profession} disabled={busy} onChange={e=>{const profession=e.target.value;if(!isKitaPersona(profession))return;onPersonaChange?.(profession);setState(s=>{const nextGroup={...s.group,choice:{...s.group.choice,profession}};return {...s,group:nextGroup,turns:[],resultIds:s.resultIds.length?findGames(nextGroup,'',excludedIds).slice(0,6).map(g=>g.id):[]};});}}>{Object.entries(kitaPersonas).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select></label></div>
      {storageNotice&&<p role="status" className="dialog-notice">{storageNotice}</p>}
      {hasWorkspace&&<nav className="dialog-tabs" aria-label="Coach-Arbeitsbereich">{['Chat','Spiele','Einheit'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}{t==='Spiele'?` (${state.resultIds.length})`:''}</button>)}</nav>}
      <div className="dialog-body" data-tab={hasWorkspace?tab:'Chat'} data-work-tab={workTab} data-workspace={hasWorkspace} data-welcome={isWelcome}>
        <section className="dialog-chat" aria-label="Gespräch">
          {isWelcome&&<div className="dialog-welcome"><span className="dialog-eyebrow">DEIN ALBA-COACH</span><h2>Was möchtest du mit deiner Gruppe bewegen?</h2><p>Beschreibe eure Gruppe, die verfügbare Zeit und das Material.</p></div>}
          {!isWelcome&&<div className="dialog-messages" role="log" aria-live="polite">{state.messages.map((m,i)=><div className={`dialog-bubble ${m.role}`} key={i}><small>{m.role==='user'?'Du':apiKey?'Coach':'Regelbasierte Hilfe'}</small><p>{m.text}</p></div>)}{partial&&<div className="dialog-bubble assistant"><small>Coach</small><p>{partial}</p></div>}<div ref={end}/></div>}
          <div className="dialog-composer">{state.selectedGameId&&<div className="dialog-theme"><p>Ausgewählt: {byId.get(state.selectedGameId)?.title}</p><label>Themenwelt<input value={theme} maxLength={200} placeholder="z. B. Waldtiere oder Weltraum" onChange={e=>setTheme(e.target.value)}/></label><button disabled={busy||!theme.trim()} onClick={()=>send('Erstelle eine Bewegungsgeschichte zum ausgewählten Spiel in der Themenwelt: '+theme.trim())}>Geschichte entwickeln</button><button disabled={busy} onClick={()=>send('Welches Folgespiel passt zum ausgewählten Spiel?')}>Folgespiel finden</button></div>}{error&&<div role="alert" className="dialog-error">{error} {authError&&<button onClick={()=>setSettingsOpen(true)}>OpenAI-Einstellungen</button>}<button disabled={busy} onClick={()=>{setState(s=>({...s,messages:s.messages.at(-1)?.role==='user'?s.messages.slice(0,-1):s.messages}));setPrompt(retry);setError('');}}>Nachricht erneut bearbeiten</button></div>}
            {busy?<div className="dialog-status" role="status"><span>{status}</span><button onClick={()=>{cancel();setError('Abgebrochen. Bisherige Ergebnisse bleiben erhalten.');}}>Abbrechen</button></div>:!isWelcome&&<div className="dialog-suggestions">{suggestions.map((s,i)=><button key={s} onClick={()=>send(s)}>{suggestionLabels[i]}</button>)}</div>}
            <form onSubmit={e=>{e.preventDefault();send(prompt);}}><label className="sr-only" htmlFor="coach-message">Nachricht an den Coach</label><textarea id="coach-message" rows={2} placeholder={isWelcome?'Wir sind 10 Kinder zwischen 4 und 5 Jahren und haben …':'Frag nach oder passe eure Einheit an …'} value={prompt} maxLength={1600} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(prompt);}}}/><button disabled={busy||!prompt.trim()} type="submit" aria-label="Nachricht senden"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20V4m-7 7 7-7 7 7"/></svg></button></form><small className="dialog-keyboard-hint">Enter senden · Shift + Enter neue Zeile</small>
            {isWelcome&&<div className="dialog-starters"><p>Beispiel direkt starten</p><div>{suggestions.map((s,i)=><button key={s} onClick={()=>send(s)} disabled={busy}><strong>{suggestionLabels[i]}</strong><span>{i===0?'10 Kinder · 4–5 Jahre · 20 Minuten':'6 Kinder · 5 Jahre · 15 Minuten'}</span><span>{i===0?'Sporthalle, wenig Vorbereitung':'Bewegungsraum'}</span><span className="dialog-starter-arrow" aria-hidden="true">↗</span></button>)}</div></div>}
          </div></section>
        {hasWorkspace&&<section className="dialog-work" aria-label="Spiele und Einheit"><nav className="dialog-work-tabs" aria-label="Ergebnisse">{['Spiele','Einheit'].map(t=><button key={t} aria-pressed={workTab===t} onClick={()=>setWorkTab(t)}>{t}{t==='Spiele'&&<span>{state.resultIds.length}</span>}</button>)}</nav>
          <div className="dialog-results"><div className="dialog-section-heading"><h2>{state.resultIds.length} passende Spielideen</h2><p>Aus {catalog.length} Einträgen der KITA-Content-Tabelle</p></div>{!state.resultIds.length&&<p>Beschreibe im Chat, welche Spiele du suchst.</p>}{state.resultIds.map(card)}</div>
          <div className="dialog-plan"><div className="dialog-plan-heading"><h2>Eure Einheit {plan&&<span>{plan.timeline.reduce((sum,item)=>sum+item.duration,0)} Min.</span>}</h2><button onClick={()=>reset(false)} disabled={busy}>Neue Einheit</button></div>{plan?<><p className="dialog-plan-headline">{plan.headline}</p>{planCheck(state).map(w=><p className="dialog-notice" key={w}>{w}</p>)}{plan.timeline.map((item,i)=><article className="dialog-plan-step" key={`${i}-${item.gameId}`}><div className="dialog-phase"><span>{item.duration}<small>Min.</small></span><small>{item.phase}</small></div><h3>{item.title}</h3><p>{item.reason}</p><div className="dialog-tip"><strong>Coach-Tipp</strong><p>{item.tip}</p></div>{byId.get(item.gameId)?.href&&<a href={byId.get(item.gameId)!.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a>}</article>)}<p className="dialog-muted">{plan.read}</p><p className="dialog-coach-note">{plan.coachNote}</p>{plan.warnings.map(w=><p className="dialog-notice" key={w}>{w}</p>)}<div className="dialog-plan-actions"><button disabled={busy||state.plans.length<2} onClick={()=>setState(s=>({...s,plans:s.plans.slice(0,-1),turns:[],messages:[...s.messages,{role:'assistant',text:'Änderung zurückgenommen. Der vorherige Planstand ist wieder aktiv.'}]}))}>Änderung zurücknehmen</button><button onClick={()=>window.print()}>Spielplan drucken</button></div></>:<p>Zuerst ein Spiel auswählen und eine Themenwelt finden. Eine freie Einheit ist auf ausdrücklichen Wunsch möglich; die unklaren ALBA-Einheitenregeln sind nicht aktiviert.</p>}</div>
        </section>
        }
      </div>
    </div></div>}
  </>;
}
