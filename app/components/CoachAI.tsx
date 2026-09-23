"use client";
import { useEffect, useRef, useState } from 'react';
import { settings, type Choice } from '../lib/alba';
import { kitaPersonas, kitaRooms, isKitaPersona } from '../lib/kita';
import { catalog } from '../lib/catalog';
import { actionFor, byId, findGames, localTurn, newSession, planCheck, restoreSession, sessionKey, understand, unitAction, type Session } from '../lib/coach';
import { applyCoachConditions, responseBlocks } from '../lib/coach-presentation';
function CoachText({text}:{text:string}) { return <div className="coach-text">{responseBlocks(text).map((b,i)=>b.kind==='ordered'?<ol key={i} start={b.start}>{b.lines.map((l,j)=><li key={j}>{l}</li>)}</ol>:b.kind==='unordered'?<ul key={i}>{b.lines.map((l,j)=><li key={j}>{l}</li>)}</ul>:<p key={i}>{b.lines.join('\n')}</p>)}</div>; }
type Props = { renderAudit:(choice:Choice)=>React.ReactNode; context: Choice; excludedIds: string[]; favorites?:string[]; toggleFavorite?:(id:string)=>void };
export function CoachAI({ renderAudit, context, excludedIds, favorites=[], toggleFavorite }: Props) {
  const [settingsOpen,setSettingsOpen]=useState(false), [auditOpen,setAuditOpen]=useState(false), [conditionsOpen,setConditionsOpen]=useState(false);
  const [contextNotice,setContextNotice]=useState(''), [preselection,setPreselection]=useState(false);
  const [draft,setDraft]=useState<Choice>(context);
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
      if(saved){try{const restored=restoreSession(saved);setState(restored);if(restored.plans.length)setWorkTab('Einheit');}catch{setStorageNotice('Der frühere Gesprächsstand ist nicht mit diesem Datenstand kompatibel. Ein neues Gespräch wurde gestartet.');}}
      else {const persona=localStorage.getItem('albathek-kita-persona-v1');if(persona&&isKitaPersona(persona))setState(newSession({...context,profession:persona}));}
      setApiKey(sessionStorage.getItem('albathek-openai-key')??'');
      setModel(sessionStorage.getItem('albathek-openai-model')??'gpt-5.6-luna');
    }catch{setStorageNotice('Sitzungsspeicher nicht verfügbar oder ungültig. Dieses Gespräch bleibt nur im Arbeitsspeicher.');}
    setReady(true);
  },[context]);
  useEffect(()=>{
    if(!ready)return;
    try{sessionStorage.setItem(sessionKey,JSON.stringify(state));}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    catch{setStorageNotice('Browserspeicher nicht verfügbar oder voll. Das Gespräch bleibt im Arbeitsspeicher.');}
  },[state,ready]);
  useEffect(()=>{const log=dialog.current?.querySelector('.dialog-messages');if(log)log.scrollTo({top:log.scrollHeight});},[state.messages,partial,tab,busy]);
  // View-only navigation: each workspace tab opens at its heading.
  useEffect(()=>{dialog.current?.querySelector('.dialog-work')?.scrollTo({top:0});},[tab,workTab]);
  useEffect(()=>{
    if(!window.visualViewport)return;
    const viewport=window.visualViewport;
    function fitKeyboard(){
      const el=dialog.current;if(!el)return;
      el.style.setProperty('--coach-viewport-height',`${viewport.height}px`);
      el.style.top=`${viewport.offsetTop}px`;
      el.dataset.keyboard=String(viewport.height<window.innerHeight*.75);
    }
    fitKeyboard();viewport.addEventListener('resize',fitKeyboard);viewport.addEventListener('scroll',fitKeyboard);
    return()=>{viewport.removeEventListener('resize',fitKeyboard);viewport.removeEventListener('scroll',fitKeyboard);};
  },[]);
  useEffect(()=>()=>{requestId.current++;controller.current?.abort();},[]);
  function cancel(){requestId.current++;controller.current?.abort();setBusy(false);setPartial('');setStatus('');}
  function saveSettings(){cancel();try{sessionStorage.setItem('albathek-openai-key',apiKey.trim());sessionStorage.setItem('albathek-openai-model',model);}catch{setStorageNotice('Einstellungen bleiben nur im Arbeitsspeicher.');}setSettingsOpen(false);}
  async function send(text:string){
    text=text.trim();if(!text||busy)return;
    setPrompt('');setError('');setAuthError(false);setPreselection(false);setRetry(text);setTab('Chat');setConditionsOpen(false);
    setContextNotice('');
    if(!apiKey.trim()){try{const next=localTurn(state,text,excludedIds);setState(next);if(next.plans.length>state.plans.length){setWorkTab('Einheit');setTab('Einheit');}if(JSON.stringify(next.group)!==JSON.stringify(state.group))setContextNotice('Gruppendaten aus deiner Nachricht übernommen.');}catch(e){setError((e as Error).message);}return;}
    const base=structuredClone(state), current=++requestId.current;
    const visible=structuredClone(base);try{visible.group=understand(text,visible.group);}catch(e){setError((e as Error).message);return;}
    if(actionFor(text,base).kind!=='explanation'){visible.resultIds=findGames(visible.group,text,excludedIds).slice(0,6).map(g=>g.id);setPreselection(true);}
    if(JSON.stringify(visible.group)!==JSON.stringify(base.group))setContextNotice('Gruppendaten aus deiner Nachricht übernommen.');
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
          if(event.type==='done'){setPreselection(false);if(JSON.stringify(event.state.group)!==JSON.stringify(base.group))setContextNotice('Gruppendaten aus deiner Nachricht übernommen.');setState(event.state);if(event.state.plans.length>base.plans.length){setWorkTab('Einheit');setTab('Einheit');}setPartial('');finished=true;}
        }
      }
      if(!finished)throw Error('Antwort unterbrochen. Dein bisheriger Plan bleibt erhalten.');
    }catch(e){if(current===requestId.current){setError((e as Error).name==='TimeoutError'?'Zeitüberschreitung. Dein bisheriger Plan bleibt erhalten.':(e as Error).message);setPartial('');}}
    finally{if(current===requestId.current){setBusy(false);setStatus('');}}
  }
  function reset(all:boolean){if(all&&!window.confirm('Das gesamte Coach-Gespräch und alle Planstände dieser Sitzung löschen?'))return;cancel();setError('');setRetry('');setTheme('');setPreselection(false);setContextNotice('');setWorkTab('Spiele');setTab('Chat');setState(all?newSession(context):{...state,plans:[],messages:[...state.messages,{role:'assistant',text:'Neue Einheit: Der Plan ist leer. Deine Gruppendaten bleiben erhalten.'}]});}
  function editConditions(){setDraft({...state.group.choice,material:state.group.noMaterial?'Ohne Material':state.group.choice.material});setConditionsOpen(x=>!x);setSettingsOpen(false);setAuditOpen(false);}
  function saveConditions(){
    try{
      const next=applyCoachConditions(state,draft,excludedIds);
      setState(next);setPreselection(false);setConditionsOpen(false);setContextNotice('Angaben übernommen · Treffer regelbasiert aktualisiert. Der Coach antwortet erst, wenn du eine Nachricht sendest.');
      try{localStorage.setItem('albathek-kita-persona-v1',next.group.choice.profession);}catch{/* memory only */}
    }catch(e){setError((e as Error).message);}
  }
  const plan=state.plans.at(-1), group=state.group;
  const createUnit=unitAction(state);
  const hasWorkspace=state.resultIds.length>0||!!plan, isWelcome=!state.messages.length;
  const suggestionLabels=plan?['Warum der Hauptteil?','Hauptteil erklären','Ruhigerer Einstieg']:state.resultIds.length?['Spiel 1 auswählen','Spiel 2 erklären']:['Kita · gemeinsam in Bewegung','Kita · kurze Bewegungspause'];
  const suggestions=plan?['Warum passt Spiel 2 der Einheit?','Erklär mir den Aufbau von Spiel 2 der Einheit.','Ersetze den Einstieg durch etwas Ruhigeres.']:state.resultIds.length?['Ich wähle Spiel 1.','Erklär mir den Aufbau von Spiel 2 aus den Treffern.']:['10 Kinder in der Kita, 4–5 Jahre, 20 Minuten in der Sporthalle. Zeig uns Spiele mit wenig Vorbereitung.','6 Kinder, 5 Jahre, Bewegungsraum, 15 Minuten'];
  // ALBA remote thumbnails retain their original source; no image proxy is used.
  /* eslint-disable @next/next/no-img-element */
  function card(id:string,index:number){const g=byId.get(id);return g&&<article className={`dialog-game ${g.image?'':'dialog-game-no-image'}`} key={id}>{g.image&&<img src={g.image} alt="" loading="lazy"/>}<div><small>Spiel {index+1} · {g.kind}</small><h3>{g.title}</h3></div><div className="dialog-game-content"><p>{g.description}</p><p className="dialog-muted"><strong>Material</strong> · {g.materials||'Nicht dokumentiert – bitte im Original prüfen.'}</p><p className="dialog-muted"><strong>Vorbereitung laut Tabelle</strong> · {g.kita?.preparationRaw||'Nicht dokumentiert'}</p><div className="dialog-card-actions">{g.href&&<a href={g.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a>}<button disabled={busy} onClick={()=>send(`Ich wähle Spiel ${index+1}.`)}>Dieses Spiel auswählen</button>{toggleFavorite&&<button className="dialog-save" aria-pressed={favorites.includes(id)} onClick={()=>toggleFavorite(id)}>{favorites.includes(id)?'♥ Gemerkt':'♡ Merken'}</button>}</div></div></article>;}
  return <>
    <div className="dialog-overlay coach-page" ref={dialog}><div className="dialog-shell">
      <header className="dialog-header">
        <div className="dialog-brand"><strong id="coach-title">ALBA<span>thek</span><span className="dialog-brand-coach">Coach</span></strong><small>{apiKey.trim()?'KI-Dialog':'Basissuche · ohne KI'}</small></div>
        <div className="dialog-header-actions">
          <button onClick={()=>reset(true)} aria-label="Neues Gespräch" title="Neues Gespräch"><svg className="dialog-new-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 7M19 3v5h-5"/></svg><span>Neues Gespräch</span></button>
          <button onClick={()=>{setSettingsOpen(!settingsOpen);setConditionsOpen(false);}} aria-expanded={settingsOpen} aria-label="OpenAI-Einstellungen" title="OpenAI-Einstellungen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m9 3-.6 2-2 .9-2-.4-2 3.5 1.4 1.6v2.8L2.4 15l2 3.5 2-.4 2 .9.6 2h4l.6-2 2-.9 2 .4 2-3.5-1.4-1.6v-2.8L20.6 9l-2-3.5-2 .4-2-.9L14 3Z"/><circle cx="11.5" cy="12" r="3"/></svg><span>Einstellungen</span></button>
          <button className="coach-audit-toggle" onClick={()=>{setAuditOpen(!auditOpen);setConditionsOpen(false);}} aria-pressed={auditOpen}>{auditOpen?'← Zum Coach':'Datenbasis prüfen'}</button>
        </div>
      </header>
      {settingsOpen&&<form className="dialog-settings" onSubmit={e=>{e.preventDefault();saveSettings();}}><label>OpenAI API-Key<input type="password" autoComplete="off" value={apiKey} onChange={e=>setApiKey(e.target.value)}/></label><label>Modell<select value={model} onChange={e=>setModel(e.target.value)}>{['gpt-5.6-luna','gpt-5.6-terra','gpt-5.6','gpt-5-mini'].map(m=><option key={m}>{m}</option>)}</select></label><p>Schlüssel und Gespräch bleiben in dieser Browsersitzung. Für KI-Antworten werden Gespräch und passende Katalogdaten an OpenAI übertragen. Bitte keine personenbezogenen Daten von Kindern eingeben.</p><button type="submit">Speichern</button><button type="button" onClick={()=>{cancel();setApiKey('');try{sessionStorage.removeItem('albathek-openai-key');}catch{/* in-memory fallback */}}}>Schlüssel entfernen</button></form>}
      <div className="dialog-context">
        <div className="coach-context-heading"><div><strong>Eure Gruppe</strong><span>{settings[group.choice.setting]} · {group.choice.age} Jahre · {group.choice.children} Kinder · {group.choice.duration} Min. · {kitaRooms[group.choice.room]}</span><span>Material: {group.noMaterial?'ohne Material':group.choice.material||'nicht festgelegt'}{group.ballPresent?' · '+(group.balls===null?'Ballanzahl offen':group.balls+' Ball/Bälle'):''}</span></div><button disabled={busy} onClick={editConditions} aria-expanded={conditionsOpen}>{conditionsOpen?'Schließen':'Angaben bearbeiten'}</button></div>
        <p>{kitaPersonas[group.choice.profession].label}{group.interests.length?' · '+group.interests.join(' · '):''}</p>
        {contextNotice&&<p className="coach-context-notice" role="status">{contextNotice}</p>}
      </div>
      {conditionsOpen&&<form className="coach-conditions" onSubmit={e=>{e.preventDefault();saveConditions();}}>
        <label className="coach-persona-field">Dein Profil<select value={draft.profession} onChange={e=>setDraft({...draft,profession:e.target.value as Choice['profession']})}>{Object.entries(kitaPersonas).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select><small>Bestimmt Vorbereitung und Spielniveau, nicht die Fähigkeiten einzelner Kinder.</small></label>
        <label>Jüngste Kinder (Jahre)<input required type="number" min="3" max="12" step="0.5" value={draft.age} onChange={e=>setDraft({...draft,age:Number(e.target.value)})}/></label>
        <label>Anzahl Kinder<input required type="number" min="1" max="100" value={draft.children} onChange={e=>setDraft({...draft,children:Number(e.target.value)})}/></label>
        <label>Zeit (Minuten)<input required type="number" min="10" max="90" value={draft.duration} onChange={e=>setDraft({...draft,duration:Number(e.target.value)})}/></label>
        <label>Ort<select value={draft.room} onChange={e=>setDraft({...draft,room:e.target.value as Choice['room']})}>{Object.entries(kitaRooms).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label className="coach-material-field">Gewünschtes Material<input value={draft.material} maxLength={100} placeholder="z. B. Reifen oder ohne Material" onChange={e=>setDraft({...draft,material:e.target.value})}/></label>
        <div className="coach-condition-actions"><p>Diese Angaben gelten für Suche und Gespräch. Klare neue Angaben im Chat aktualisieren sie ebenfalls.</p><button type="submit">Angaben übernehmen</button></div>
      </form>}
      {storageNotice&&<p role="status" className="dialog-notice">{storageNotice}</p>}
      {auditOpen?<div className="coach-audit-scroll">{renderAudit(group.choice)}</div>:<>
      {hasWorkspace&&<nav className="dialog-tabs" aria-label="Coach-Arbeitsbereich">{['Chat','Spiele','Einheit'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}{t==='Spiele'?` (${state.resultIds.length})`:''}</button>)}</nav>}
      <div className="dialog-body" data-tab={hasWorkspace?tab:'Chat'} data-work-tab={workTab} data-workspace={hasWorkspace} data-welcome={isWelcome}>
        <section className="dialog-chat" aria-label="Gespräch">
          {isWelcome&&<div className="dialog-welcome"><span className="dialog-eyebrow">DEIN ALBA-COACH</span><h2>Was möchtest du mit deiner Gruppe bewegen?</h2><p>Beschreibe eure Gruppe, die verfügbare Zeit und das Material.</p></div>}
          {!isWelcome&&<div className="dialog-messages" role="log" aria-live="polite">{state.messages.map((m,i)=><div className={`dialog-bubble ${m.role}`} key={i}><small>{m.role==='user'?'Du':apiKey?'Coach':'Regelbasierte Hilfe'}</small><CoachText text={m.text}/></div>)}{partial&&<div className="dialog-bubble assistant"><small>Coach</small><CoachText text={partial}/></div>}{state.selectedGameId&&<details className="dialog-theme" open><summary>Themenwelt für dieses Spiel</summary><p>Ausgewählt: {byId.get(state.selectedGameId)?.title}</p><label>Themenwelt<input value={theme} maxLength={200} placeholder="z. B. Waldtiere oder Weltraum" onChange={e=>setTheme(e.target.value)}/></label><button disabled={busy||!theme.trim()} onClick={()=>send('Erstelle eine Bewegungsgeschichte zum ausgewählten Spiel in der Themenwelt: '+theme.trim())}>Geschichte entwickeln</button><button disabled={busy} onClick={()=>send('Welches Folgespiel passt zum ausgewählten Spiel?')}>Folgespiel finden</button></details>}<div ref={end}/></div>}
          <div className="dialog-composer">{error&&<div role="alert" className="dialog-error">{error} {authError&&<button onClick={()=>setSettingsOpen(true)}>OpenAI-Einstellungen</button>}<button disabled={busy} onClick={()=>{setState(s=>({...s,messages:s.messages.at(-1)?.role==='user'?s.messages.slice(0,-1):s.messages}));setPrompt(retry);setError('');}}>Nachricht erneut bearbeiten</button></div>}
            {busy?<div className="dialog-status"><span role="status"><span className="coach-spinner" aria-hidden="true"/>{status}</span><button onClick={()=>{cancel();setError('Abgebrochen. Bisherige Ergebnisse bleiben erhalten.');}}>Abbrechen</button></div>:!isWelcome&&<div className="dialog-suggestions">{!plan&&<button className="coach-create-unit" onClick={()=>send(createUnit.prompt)}>{createUnit.label}</button>}{suggestions.map((s,i)=><button key={s} onClick={()=>send(s)}>{suggestionLabels[i]}</button>)}</div>}
            <form onSubmit={e=>{e.preventDefault();send(prompt);}}><label className="sr-only" htmlFor="coach-message">Nachricht an den Coach</label><textarea id="coach-message" rows={2} placeholder={isWelcome?'Wir sind 10 Kinder zwischen 4 und 5 Jahren und haben …':'Frag nach oder passe eure Einheit an …'} value={prompt} maxLength={1600} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(prompt);}}}/><button disabled={busy||!prompt.trim()} type="submit" aria-label="Nachricht senden"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20V4m-7 7 7-7 7 7"/></svg></button></form><small className="dialog-keyboard-hint">Enter senden · Shift + Enter neue Zeile</small>
            {isWelcome&&<div className="dialog-starters"><p>Beispiel direkt starten</p><div>{suggestions.map((s,i)=><button key={s} onClick={()=>send(s)} disabled={busy}><strong>{suggestionLabels[i]}</strong><span>{i===0?'10 Kinder · 4–5 Jahre · 20 Minuten':'6 Kinder · 5 Jahre · 15 Minuten'}</span><span>{i===0?'Sporthalle, wenig Vorbereitung':'Bewegungsraum'}</span><span className="dialog-starter-arrow" aria-hidden="true">↗</span></button>)}</div></div>}
          </div></section>
        {hasWorkspace&&<section className="dialog-work" aria-label="Spiele und Einheit"><nav className="dialog-work-tabs" aria-label="Ergebnisse">{['Spiele','Einheit'].map(t=><button key={t} aria-pressed={workTab===t} onClick={()=>setWorkTab(t)}>{t}{t==='Spiele'&&<span>{state.resultIds.length}</span>}</button>)}</nav>
          <div className="dialog-results"><div className="dialog-section-heading"><h2>{state.resultIds.length} {preselection?'Spiele in der Vorauswahl':'passende Spielideen'}</h2>{preselection&&<p className="coach-preselection">{busy?'Regelbasierte Vorauswahl · Die KI-Antwort ist noch in Arbeit.':'Regelbasierte Vorauswahl · Die KI-Anfrage wurde nicht abgeschlossen.'}</p>}<p>Aus {catalog.length} Einträgen der KITA-Content-Tabelle</p></div>{!state.resultIds.length&&<p>Beschreibe im Chat, welche Spiele du suchst.</p>}{state.resultIds.map(card)}</div>
          <div className="dialog-plan"><div className="dialog-plan-heading"><h2>Eure Einheit {plan&&<span>{plan.timeline.reduce((sum,item)=>sum+item.duration,0)} Min.</span>}</h2>{plan&&<button onClick={()=>reset(false)} disabled={busy}>Neue Einheit</button>}</div>{plan?<><p className="dialog-plan-headline">{plan.headline}</p>{planCheck(state).map(w=><p className="dialog-notice" key={w}>{w}</p>)}{plan.timeline.map((item,i)=><article className="dialog-plan-step" key={`${i}-${item.gameId}`}><div className="dialog-phase"><span>{item.duration}<small>Min.</small></span><small>{item.phase}</small></div><h3>{item.title}</h3><p>{item.reason}</p><div className="dialog-tip"><strong>Coach-Tipp</strong><p>{item.tip}</p></div>{byId.get(item.gameId)?.href&&<a href={byId.get(item.gameId)!.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a>}</article>)}<p className="dialog-muted">{plan.read}</p><p className="dialog-coach-note">{plan.coachNote}</p>{plan.warnings.map(w=><p className="dialog-notice" key={w}>{w}</p>)}<div className="dialog-plan-actions"><button disabled={busy||state.plans.length<2} onClick={()=>setState(s=>({...s,plans:s.plans.slice(0,-1),turns:[],messages:[...s.messages,{role:'assistant',text:'Änderung zurückgenommen. Der vorherige Planstand ist wieder aktiv.'}]}))}>Änderung zurücknehmen</button><button onClick={()=>window.print()}>Spielplan drucken</button></div></>:<div className="coach-unit-empty"><p>Stelle aus passenden Spielen eine freie Einheit zusammen. Eine Spielauswahl oder Themenwelt ist dafür nicht erforderlich.</p><button className="coach-create-unit" disabled={busy} onClick={()=>send(createUnit.prompt)}>{createUnit.label}</button><p className="dialog-muted">Übernimmt eure aktuellen Gruppendaten. Drei Abschnitte als eigener Planungsvorschlag – anschließend im Chat anpassbar.</p></div>}</div>
        </section>
        }
      </div>
      </>}
    </div></div>
  </>;
}
