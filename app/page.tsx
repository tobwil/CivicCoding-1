"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CoachAI } from "./components/CoachAI";
import { catalog, searchCatalog, testGames, type CatalogGame } from "./lib/catalog";
import { settings, professions, professionOptions, allowedSchoolContexts, rooms, goals, defaultChoice, isNovice, guidance, calendarFor, evaluateGame, type Choice } from "./lib/alba";

function Stepper({ label, value, min, max, unit, onChange }: { label:string; value:number; min:number; max:number; unit:string; onChange:(n:number)=>void }) {
  return <div className="field"><span>{label}</span><div className="number-stepper">
    <button aria-label={label+" verringern"} disabled={value<=min} onClick={()=>onChange(Math.max(min,value-1))}>−</button>
    <label><span className="sr-only">{label}</span><input type="number" min={min} max={max} step={label==="Jüngste Kinder"?.5:1} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,Number(e.target.value)||min)))}/><span>{unit}</span></label>
    <button aria-label={label+" erhöhen"} disabled={value>=max} onClick={()=>onChange(Math.min(max,value+1))}>+</button>
  </div></div>;
}

function GameCard({ game, favorite, toggle, dismiss, showProfile }: { game:CatalogGame; favorite:boolean; toggle:()=>void; dismiss:()=>void; showProfile:boolean }) {
  return <article className="catalog-card" id={"spiel-"+game.id}>
    <div className="catalog-image">
      <a href={game.href} target="_blank" rel="noreferrer" aria-label={game.title+" – Original öffnen"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={game.image} alt="" loading="lazy" width={600} height={400}/>
        <span className="video-link">↗ Original & Video</span>
      </a>
      <button className={"favorite "+(favorite?"is-favorite":"")} onClick={toggle} aria-pressed={favorite} aria-label={game.title+(favorite?" nicht mehr merken":" merken")}>{favorite?"♥":"♡"}</button>
    </div>
    <div className="catalog-card-body">
      <div className="catalog-meta"><span>{game.kind}</span>{game.quick&&<span>Schnell vorbereitet</span>}</div>
      <h3><a href={game.href} target="_blank" rel="noreferrer">{game.title}</a></h3>
      <p className="audience">{game.audience}</p>
      {game.description&&<p className="catalog-description">{game.description}</p>}
      <details className="recipe"><summary>Material & Details <span>+</span></summary><div className="recipe-body">
        <p><strong>Material:</strong> {game.materials||"Bitte in der Originalanleitung prüfen."}</p>
        {showProfile&&game.profile&&<><p className="trial-tag">ALBA-Detailprofil · in Erprobung</p><p>{game.profile.tip}</p><p>Neue Gruppe: ab {game.profile.ageNew} Jahren · {game.profile.minChildren??"Minimum offen"}–{game.profile.maxChildren} Kinder auf einem Basketballfeld.</p></>}
        <a href={game.href} target="_blank" rel="noreferrer">Vollständige Anleitung bei ALBA ↗</a>
        <button className="dismiss-game" onClick={dismiss}>Für heute ausblenden</button>
      </div></details>
    </div>
  </article>;
}

export default function Home() {
  const [choice,setChoice]=useState<Choice>(defaultChoice);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [dismissed,setDismissed]=useState<string[]>([]);
  const [query,setQuery]=useState("");
  const [favoritesOnly,setFavoritesOnly]=useState(false);
  const [personalized,setPersonalized]=useState(false);
  const [kind,setKind]=useState("Alle");
  const [visible,setVisible]=useState(24);
  const resultsRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    try {
      const saved:unknown=JSON.parse(window.localStorage.getItem("albathek-favorites")??"[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(Array.isArray(saved)) setFavorites(saved.filter((x):x is string=>typeof x==="string"));
    } catch { /* Storage is optional. */ }
  },[]);
  const matches=useMemo(()=>searchCatalog(choice,query).filter(x=>(!personalized||x.eligible)&&!dismissed.includes(x.game.id)&&(!favoritesOnly||favorites.includes(x.game.id))&&(kind==="Alle"||x.game.kind===kind)),[choice,query,personalized,dismissed,favoritesOnly,favorites,kind]);
  const advice=guidance(choice);
  const calendar=calendarFor(choice);
  function updateChoice<K extends keyof Choice>(key:K,value:Choice[K]) {
    setChoice(current=>{
      const next={...current,[key]:value};
      if(!professionOptions(next.setting).includes(next.profession)) next.profession="coach";
      if(!allowedSchoolContexts(next).includes(next.schoolContext)) next.schoolContext="Alle passenden Anlässe";
      if(next.setting==="verein") next.sportswear=true;
      if(isNovice(next)) next.experience=1;
      return next;
    });
    setDismissed([]);setVisible(24);setPersonalized(true);
  }
  function toggleFavorite(id:string) {
    setFavorites(current=>{
      const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
      try{window.localStorage.setItem("albathek-favorites",JSON.stringify(next));}catch{/* Keep in memory. */}
      return next;
    });
  }
  function reset(){setChoice(defaultChoice);setQuery("");setDismissed([]);setFavoritesOnly(false);setPersonalized(false);setKind("Alle");setVisible(24);}
  function navigate(personal:boolean){setPersonalized(personal);setFavoritesOnly(false);setVisible(24);}
  return <main>
    <header className="site-header catalog-header">
      <a className="wordmark" href="#start" aria-label="ALBAthek Startseite"><span>ALBA</span>thek<small>SPORT DIGITAL</small></a>
      <nav aria-label="Hauptnavigation">
        <a href="#entdecken" onClick={()=>navigate(false)}>Spiele entdecken</a>
        <a href="#finder" onClick={()=>navigate(true)}>Für deine Gruppe</a>
        <a href="#coach-ai">Coach AI ✦</a>
      </nav>
      <button className={"favorites-toggle "+(favoritesOnly?"selected":"")} aria-pressed={favoritesOnly} onClick={()=>{setFavoritesOnly(x=>!x);setVisible(24);resultsRef.current?.scrollIntoView({behavior:"smooth"});}}><span aria-hidden="true">♡</span> Gemerkt <span className="favorites-count">{favorites.length}</span></button>
    </header>

    <section className="hero hero-update" id="start">
      <div className="hero-copy"><p className="eyebrow">KITA · GRUNDSCHULE · VEREIN</p><h1>Weniger suchen.<br/><em>Mehr zusammen spielen.</em></h1><p className="hero-lead">Echte ALBAthek-Spiele. Eure Gruppe. Neue Möglichkeiten.</p></div>
      <div className="catalog-count"><strong>{catalog.length}</strong><span>Spiele & Variationen</span><small>aus der öffentlichen ALBAthek</small></div>
    </section>

    <section className="finder finder-update" id="finder" aria-labelledby="finder-title">
      <div className="finder-heading"><span className="step-badge">01</span><div><p>WAS PASST HEUTE?</p><h2 id="finder-title">Eure Gruppe in vier Angaben.</h2></div><button className="text-button" onClick={reset}>Zurücksetzen ↻</button></div>
      <div className="setting-tabs" role="group" aria-label="Einrichtung">{Object.entries(settings).map(([key,label])=><button key={key} aria-pressed={choice.setting===key} className={choice.setting===key?"active":""} onClick={()=>updateChoice("setting",key as Choice["setting"])}>{label}</button>)}</div>
      <div className="quick-fields">
        <Stepper label="Jüngste Kinder" value={choice.age} min={3} max={12} unit="Jahre" onChange={n=>updateChoice("age",n)}/>
        <Stepper label="Gruppengröße" value={choice.children} min={1} max={100} unit="Kinder" onChange={n=>updateChoice("children",n)}/>
        <fieldset className="field choice-pills"><legend>Zeit</legend><div>{[15,20,30,45,60].map(n=><button key={n} aria-pressed={choice.duration===n} onClick={()=>updateChoice("duration",n)}>{n}<small> Min.</small></button>)}</div></fieldset>
        <fieldset className="field choice-pills room-pills"><legend>Ort</legend><div>{rooms.map(room=><button key={room} aria-pressed={choice.room===room} onClick={()=>updateChoice("room",room)}>{room==="Bewegungsraum"?"Kleiner Raum":room==="Outdoor"?"Draußen":"Halle"}</button>)}</div></fieldset>
      </div>
      <details className="advanced-filters"><summary>Ziel, Material & Anleitung einstellen <span>+</span></summary><div className="finder-fields">
        <label className="field"><span>Euer Ziel</span><select value={choice.goal} onChange={e=>updateChoice("goal",e.target.value as Choice["goal"])}>{goals.map(g=><option key={g}>{g}</option>)}</select></label>
        <label className="field"><span>Material suchen</span><input value={choice.material} placeholder="z. B. Reifen" maxLength={100} onChange={e=>updateChoice("material",e.target.value)}/></label>
        <label className="field wide"><span>Wer leitet an?</span><select value={choice.profession} onChange={e=>updateChoice("profession",e.target.value as Choice["profession"])}>{professionOptions(choice.setting).map(key=><option key={key} value={key}>{professions[key]}</option>)}</select></label>
        <label className="field wide"><span>Erfahrung der Gruppe</span><select value={choice.experience} disabled={isNovice(choice)} onChange={e=>updateChoice("experience",Number(e.target.value) as 1|2|3)}><option value={1}>Neue Gruppe / wenig Spielerfahrung</option><option value={2}>Bekannte Gruppe, unter Begleitung</option><option value={3}>Bekanntes Spiel, selbstorganisiert</option></select></label>
        <label className="field"><span>Genaue Dauer</span><input type="number" min={10} max={90} value={choice.duration} onChange={e=>updateChoice("duration",Math.min(90,Math.max(10,Number(e.target.value)||10)))}/></label>
        <label className="check-control"><input type="checkbox" checked={choice.sportswear} disabled={choice.setting==="verein"} onChange={e=>updateChoice("sportswear",e.target.checked)}/>Sportkleidung vorhanden</label>
        {choice.setting==="grundschule"&&<label className="field wide"><span>Anlass</span><select value={choice.schoolContext} onChange={e=>updateChoice("schoolContext",e.target.value)}>{allowedSchoolContexts(choice).map(x=><option key={x}>{x}</option>)}</select></label>}
      </div></details>
      <div className="finder-footer"><p>Die Auswahl unterstützt dich. Raum, Gruppengröße und Material bitte im Original prüfen.</p><button className="primary-button" onClick={()=>{setPersonalized(true);resultsRef.current?.scrollIntoView({behavior:"smooth"});}}>Spiele für uns finden ↘</button></div>
    </section>

    <section className="recommendations" id="entdecken" ref={resultsRef} aria-labelledby="recommendation-title">
      <div className="section-heading"><div><p className="eyebrow dark">DIE ALBATHEK-SAMMLUNG</p><h2 id="recommendation-title">{favoritesOnly?"Deine Merkliste.":personalized?"Für deine Gruppe.":"Spiele entdecken."}</h2></div><p aria-live="polite">{matches.length} von {catalog.length} Spielen & Variationen</p></div>
      <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Spielideen durchsuchen" placeholder="Spiel, Bewegung oder Material suchen …" value={query} onChange={e=>{setQuery(e.target.value);setVisible(24);}}/>{query&&<button onClick={()=>{setQuery("");setVisible(24);}} aria-label="Suchbegriff löschen">×</button>}</label>
      <div className="catalog-toolbar"><div className="segmented" role="group" aria-label="Spielart">{["Alle","Grundspiel","Variation"].map(k=><button key={k} aria-pressed={kind===k} onClick={()=>{setKind(k);setVisible(24);}}>{k==="Alle"?"Alle Spiele":k==="Grundspiel"?"Grundspiele":"Variationen"}</button>)}</div><button className="text-button" onClick={()=>{setPersonalized(x=>!x);setVisible(24);}}>{personalized?"Gesamten Katalog zeigen":"Für meine Gruppe eingrenzen"}</button></div>
      {personalized&&<p className="catalog-hint">Vorauswahl nach vorhandenen Angaben, keine vollständige Eignungsprüfung. Die neuen Detailprofile sind nur im optionalen ALBA-Labor aktiv.</p>}
      {matches.length?<div className="alba-game-grid">{matches.slice(0,visible).map(({game})=><GameCard key={game.id} game={game} favorite={favorites.includes(game.id)} toggle={()=>toggleFavorite(game.id)} dismiss={()=>setDismissed(x=>[...x,game.id])} showProfile={Boolean(choice.useTestProfiles)}/>)}</div>:<div className="empty-state"><h3>Hier ist noch kein Treffer.</h3><p>Ändere den Suchbegriff oder zeige den gesamten Katalog.</p><button onClick={reset}>Alle Spiele anzeigen</button></div>}
      {matches.length>visible&&<div className="load-more"><p>{Math.min(visible,matches.length)} von {matches.length} angezeigt</p><button className="primary-button" onClick={()=>setVisible(n=>n+24)}>Weitere 24 Spiele laden ↓</button></div>}
      {dismissed.length>0&&<button className="text-button" onClick={()=>setDismissed([])}>Ausgeblendete Spiele wieder zeigen ({dismissed.length})</button>}
      {calendar&&personalized&&<aside className="calendar-card"><div><h3>Ein roter Faden für eure Einheit.</h3><p>Für längere Angebote empfiehlt ALBA aufeinander aufbauende Einheiten.</p></div><a href={calendar.href} target="_blank" rel="noreferrer">{calendar.title} öffnen ↗</a></aside>}
    </section>

    <CoachAI context={choice} recommendations={catalog} excludedIds={dismissed} favorites={favorites} toggleFavorite={toggleFavorite}/>

    <section className="alba-lab" id="alba-labor"><details><summary><span className="trial-tag">IN ERPROBUNG</span><span><strong>ALBA-Labor</strong><small>10 angelieferte Testprofile & neue Empfehlungsregeln</small></span><span>+</span></summary><div className="lab-body">
      <p>ALBA hat zehn Spielprofile, eine Regelübersicht und das SPORT-Vernetzt-Rahmenwerk zum Testen bereitgestellt. Neun Profile ergänzen bereits öffentlich gelistete Spiele; Gespensterparty liegt nur als Testdatensatz vor. Diese Daten sind kein Ersatz für die ALBAthek.</p>
      <label className="check-control"><input type="checkbox" checked={Boolean(choice.useTestProfiles)} onChange={e=>updateChoice("useTestProfiles",e.target.checked)}/>Experimentelle Detailprüfung für die zugeordneten Spiele aktivieren</label>
      <p>Nur diese neun Spiele lassen sich damit detailliert prüfen. Andere Katalogspiele behalten ihre öffentliche Datenbasis. Die Grundschul- und Vereinsregeln sind Entwürfe.</p>
      {choice.useTestProfiles&&<div className="finder-fields">
        <label className="field"><span>Vorbereitung höchstens</span><select value={choice.preparation} onChange={e=>updateChoice("preparation",e.target.value)}><option value="">Egal</option><option value="minimal">Minimal</option><option value="wenig">Bis 5 Minuten</option><option value="viel">Ca. 10 Minuten</option></select></label>
        <label className="field"><span>Regelumfang höchstens</span><select value={choice.complexity} onChange={e=>updateChoice("complexity",e.target.value)}><option value="">Egal</option><option value="wenig">Wenig</option><option value="mittel">Mittel</option><option value="hoch">Hoch</option></select></label>
        <label className="field"><span>Intensität</span><select value={choice.intensity} onChange={e=>updateChoice("intensity",e.target.value)}><option value="">Alle</option><option value="gering">Gering</option><option value="mittel">Mittel</option><option value="hoch">Hoch</option></select></label>
        <label className="field"><span>Sozialform</span><select value={choice.social} onChange={e=>updateChoice("social",e.target.value)}><option value="">Alle</option><option value="paar">Im Paar</option><option value="allein">Allein</option><option value="gruppe">In der Gruppe</option></select></label>
      </div>}
      <div className="lab-profiles">{testGames.map(game=>{const match=evaluateGame(game,choice);return <details key={game.id}><summary>{game.name} <span>Testprofil</span></summary><p>{game.description}</p><p><strong>Material:</strong> {game.materials}</p><ol>{game.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><p><strong>ALBA-Tipp:</strong> {game.tip}</p><p>Detailprüfung für eure Angaben: {match.eligible?"Keine Abweichung im Testprofil.":match.excluded.join(" · ")}</p><small>Quelle: ALBA-Contenttabelle, Zeile {game.sourceRow}</small></details>;})}</div>
    </div></details></section>

    <section className="framework-panel" aria-labelledby="framework-title"><div><p className="eyebrow">SPORT VERNETZT · RAHMENWERK</p><h2 id="framework-title">Das Kind<br/><em>im Mittelpunkt.</em></h2><p>Erleben. Weiterentwickeln. Überführen.</p></div><ol>{advice.map((line,i)=><li key={line}><span>{String(i+1).padStart(2,"0")}</span>{line}</li>)}</ol><small>ALBA-Rahmenwerk Kindersport, 12.06.2026 · Seiten 14–18, 21–32</small></section>
    <footer><div className="wordmark footer-mark"><span>ALBA</span>thek<small>SPORT DIGITAL</small></div><p>{catalog.length} öffentliche Spiele & Variationen · Stand 07.09.2026</p><p>Prototyp · Inhalte und Bilder: © ALBA BERLIN · <a href="https://albathek.de/filter/32a8ba1b" target="_blank" rel="noreferrer">Zum Original ↗</a></p></footer>
  </main>;
}
