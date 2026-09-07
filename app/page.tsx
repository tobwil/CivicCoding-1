"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CoachAI } from "./components/CoachAI";
import { archiveGames, games, settings, professions, professionOptions, allowedSchoolContexts, rooms, goals, defaultChoice, findGames, isNovice, guidance, calendarFor, normalize, type Choice, type Game, type Match } from "./lib/alba";

function Recipe({game}: {game: Game}) {
  return <details className="recipe"><summary>Spielanleitung & ALBA-Tipps <span>↗</span></summary><div className="recipe-body">
    <p>{game.description}</p><h4>Das brauchst du</h4><p>{game.materials}</p>
    <h4>So geht’s</h4><ol>{game.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
    <h4>Coach-Tipp</h4><p>{game.tip}</p>
    {game.adaptation && <><h4>An die Gruppe anpassen</h4><p>{game.adaptation}</p></>}
    {game.quote && <blockquote>{game.quote}</blockquote>}
    <dl className="game-facts">
      <div><dt>Neue Gruppe</dt><dd>ab {game.ageNew} Jahren</dd></div>
      <div><dt>Bekannt & begleitet</dt><dd>ab {game.ageGuided} Jahren</dd></div>
      <div><dt>Selbstorganisiert</dt><dd>ab {game.ageIndependent} Jahren</dd></div>
      <div><dt>Gruppengröße / Halle</dt><dd>{game.minChildren ?? "Minimum offen"}–{game.maxChildren}</dd></div>
      <div><dt>Sportkleidung</dt><dd>{game.sportswear ?? "Nicht angegeben"}</dd></div>
      <div><dt>Sozialform</dt><dd>{game.social}</dd></div>
    </dl><small>Quelle: ALBA-Contenttabelle · Zeile {game.sourceRow} · Coach: {game.coach}</small>
  </div></details>;
}
function GameCard({match,favorite,toggle,dismiss}: {match:Match;favorite:boolean;toggle:()=>void;dismiss:()=>void}) {
  const {game,reason,notes}=match;
  return <article className="game-card alba-card" id={`spiel-${game.id}`}>
    <div className={`alba-card-head intensity-${game.intensity}`}>
      <div><span className="source-tag">ALBA TESTSPIEL {String(game.sourceRow-1).padStart(2,"0")}</span><p>{game.category}</p></div>
      <button className={`favorite ${favorite?"is-favorite":""}`} onClick={toggle} aria-pressed={favorite} aria-label={`${game.name} ${favorite?"nicht mehr merken":"merken"}`}>{favorite?"♥":"♡"}</button>
      <h3>{game.name}</h3><span>{game.intensity==="gering"?"Ruhiger bewegen":game.intensity==="hoch"?"Viel Energie":"Gemeinsam aktiv"}</span>
    </div>
    <div className="card-body"><div className="card-meta"><span>{game.form}</span><span>{game.rules} Regeln</span>{game.attractiveness==="Knaller"&&<span>ALBA-Knaller</span>}</div>
      <p className="match-reason">✓ {reason.join(" · ")}</p><p className="material-line"><strong>Material</strong> {game.materials}</p>
      {notes.map(note=><p className="data-note" key={note}>{note}</p>)}<Recipe game={game}/><button className="dismiss-game" onClick={dismiss}>Für heute ausblenden</button>
    </div>
  </article>;
}
export default function Home() {
  const [choice,setChoice]=useState<Choice>(defaultChoice);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [dismissed,setDismissed]=useState<string[]>([]);
  const [query,setQuery]=useState("");
  const [favoritesOnly,setFavoritesOnly]=useState(false);
  const resultsRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    try {
      const saved:unknown=JSON.parse(window.localStorage.getItem("albathek-favorites")??"[]");
      // Restore browser-only preferences after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(Array.isArray(saved)) setFavorites(saved.filter((x):x is string=>typeof x==="string"));
    } catch { /* Invalid browser preferences do not block the finder. */ }
  },[]);
  const allMatches=useMemo(()=>findGames(choice,query),[choice,query]);
  const matches=allMatches.filter(x=>x.eligible&&!dismissed.includes(x.game.id)&&(!favoritesOnly||favorites.includes(x.game.id)));
  const excluded=allMatches.filter(x=>!x.eligible);
  const archive=archiveGames.filter(g=>normalize(g.title).includes(normalize(query))&&(!favoritesOnly||favorites.includes(g.id)));
  const advice=guidance(choice);
  const calendar=calendarFor(choice);
  function updateChoice<K extends keyof Choice>(key:K,value:Choice[K]){
    setChoice(current=>{
      const next={...current,[key]:value};
      if(!professionOptions(next.setting).includes(next.profession)) next.profession="coach";
      if(!allowedSchoolContexts(next).includes(next.schoolContext)) next.schoolContext="Alle passenden Anlässe";
      if(next.setting==="verein") next.sportswear=true;
      if(isNovice(next)) next.experience=1;
      return next;
    });setDismissed([]);
  }
  function toggleFavorite(id:string){
    setFavorites(current=>{
      const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
      try{window.localStorage.setItem("albathek-favorites",JSON.stringify(next));}catch{/* Session works without storage. */}
      return next;
    });
  }
  function reset(){setChoice(defaultChoice);setQuery("");setDismissed([]);setFavoritesOnly(false);}
  return <main>
    <header className="site-header">
      <a className="wordmark" href="#start" aria-label="ALBAthek Startseite"><span>ALBA</span>thek<small>SPORT DIGITAL</small></a>
      <nav aria-label="Hauptnavigation"><a href="#empfehlungen">Für dich</a><a href="#entdecken">Spiele entdecken</a><a href="#coach-ai">Coach AI ✦</a></nav>
      <button className={`saved-link saved-button ${favoritesOnly?"selected":""}`} aria-pressed={favoritesOnly} onClick={()=>{setFavoritesOnly(x=>!x);resultsRef.current?.scrollIntoView({behavior:"smooth"});}}>♡ Gemerkt ({favorites.length})</button>
    </header>
    <section className="hero hero-update" id="start">
      <div className="hero-copy"><p className="eyebrow">KITA · GRUNDSCHULE · VEREIN</p><h1>Deine Gruppe.<br/><em>Euer nächstes Spiel.</em></h1><p className="hero-lead">Jetzt mit zehn neuen ALBA-Spielanleitungen und Empfehlungen nach euren Rahmenbedingungen.</p></div>
      <div className="catalog-count"><strong>{games.length+archiveGames.length}</strong><span>Spielideen zum Entdecken</span><small>{games.length} mit neuen ALBA-Daten</small></div>
    </section>
    <section className="finder finder-update" aria-labelledby="finder-title">
      <div className="finder-heading"><span className="step-badge">01</span><div><p>WAS PASST HEUTE?</p><h2 id="finder-title">Kurz einstellen. Gemeinsam loslegen.</h2></div><button className="text-button" onClick={reset}>Zurücksetzen ↻</button></div>
      <div className="setting-tabs" role="group" aria-label="Setting">{Object.entries(settings).map(([key,label])=><button key={key} aria-pressed={choice.setting===key} className={choice.setting===key?"active":""} onClick={()=>updateChoice("setting",key as Choice["setting"])}>{label}</button>)}</div>
      <div className="finder-fields">
        <label className="field wide"><span>Wer leitet an?</span><select value={choice.profession} onChange={e=>updateChoice("profession",e.target.value as Choice["profession"])}>{professionOptions(choice.setting).map(key=><option key={key} value={key}>{professions[key]}</option>)}</select></label>
        <label className="field"><span>Jüngste Kinder</span><select value={choice.age} onChange={e=>updateChoice("age",Number(e.target.value))}>{Array.from({length:19},(_,i)=>3+i*.5).map(age=><option key={age} value={age}>{age.toLocaleString("de-DE")} Jahre</option>)}</select></label>
        <label className="field"><span>Anzahl Kinder</span><input type="number" min={1} max={100} value={choice.children} onChange={e=>updateChoice("children",Math.min(100,Math.max(1,Number(e.target.value)||1)))}/></label>
        <label className="field"><span>Zeit fürs Angebot</span><select value={choice.duration} onChange={e=>updateChoice("duration",Number(e.target.value))}>{[10,15,20,30,45,60,90].map(n=><option key={n} value={n}>{n} Minuten</option>)}</select></label>
        <label className="field"><span>Wo spielt ihr?</span><select value={choice.room} onChange={e=>updateChoice("room",e.target.value as Choice["room"])}>{rooms.map(room=><option key={room}>{room}</option>)}</select></label>
        <label className="field wide"><span>Wie vertraut ist die Gruppe?</span><select value={choice.experience} disabled={isNovice(choice)} onChange={e=>updateChoice("experience",Number(e.target.value) as 1|2|3)}><option value={1}>Neue Gruppe / wenig Spielerfahrung</option><option value={2}>Bekannte Gruppe, unter Begleitung</option><option value={3}>Bekanntes Spiel, selbstorganisiert</option></select></label>
        {choice.setting==="grundschule"&&<label className="field wide"><span>Anlass im Bewegungsband</span><select value={choice.schoolContext} onChange={e=>updateChoice("schoolContext",e.target.value)}>{allowedSchoolContexts(choice).map(x=><option key={x}>{x}</option>)}</select></label>}
      </div>
      <div className="filter-bottom"><label className="check-control"><input type="checkbox" checked={choice.sportswear} disabled={choice.setting==="verein"} onChange={e=>updateChoice("sportswear",e.target.checked)}/>Sportkleidung vorhanden{choice.setting==="verein"?" (im Verein vorausgesetzt)":""}</label><span className="mode-label">{isNovice(choice)?"Einsteigermodus nach ALBA-Regeln":"Erfahrene Anleitung"}</span></div>
      <details className="advanced-filters"><summary>Ziel, Material & weitere Filter <span>+</span></summary><div className="finder-fields">
        <label className="field"><span>Euer Ziel</span><select value={choice.goal} onChange={e=>updateChoice("goal",e.target.value as Choice["goal"])}>{goals.map(g=><option key={g}>{g}</option>)}</select></label>
        <label className="field"><span>Spiel mit diesem Material</span><input value={choice.material} placeholder="z. B. Reifen" maxLength={100} onChange={e=>updateChoice("material",e.target.value)}/><small>Weitere Materialien stehen beim Spiel.</small></label>
        <label className="field"><span>Vorbereitung höchstens</span><select value={choice.preparation} onChange={e=>updateChoice("preparation",e.target.value)}><option value="">Egal</option><option value="minimal">Minimal</option><option value="wenig">Bis 5 Minuten</option><option value="viel">Ca. 10 Minuten</option></select></label>
        <label className="field"><span>Regelumfang höchstens</span><select value={choice.complexity} onChange={e=>updateChoice("complexity",e.target.value)}><option value="">Egal</option><option value="wenig">Wenig</option><option value="mittel">Mittel</option><option value="hoch">Hoch</option></select></label>
        <label className="field"><span>Intensität</span><select value={choice.intensity} onChange={e=>updateChoice("intensity",e.target.value)}><option value="">Alle</option><option value="gering">Gering</option><option value="mittel">Mittel</option><option value="hoch">Hoch</option></select></label>
        <label className="field"><span>Sozialform</span><select value={choice.social} onChange={e=>updateChoice("social",e.target.value)}><option value="">Alle</option><option value="paar">Im Paar</option><option value="allein">Allein</option><option value="gruppe">In der Gruppe</option></select></label>
      </div></details>
      <div className="finder-footer"><p><span>✓</span>{settings[choice.setting]} · ab {choice.age.toLocaleString("de-DE")} Jahren · {choice.children} Kinder · {choice.duration} Min.</p><button className="primary-button" onClick={()=>resultsRef.current?.scrollIntoView({behavior:"smooth"})}>{matches.length} passende Spiele zeigen ↘</button></div>
    </section>
    <section className="recommendations" id="empfehlungen" ref={resultsRef} aria-labelledby="recommendation-title">
      <div className="section-heading"><div><p className="eyebrow dark">AUS DEN NEUEN ALBA-INHALTEN</p><h2 id="recommendation-title">Das passt <em>heute.</em></h2></div><p aria-live="polite">{matches.length} von {games.length} Testspielen{favoritesOnly?" · nur gemerkte":""}</p></div>
      <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Spielideen durchsuchen" placeholder="Spiel, Thema, Bewegung oder Material suchen …" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery("")} aria-label="Suchbegriff löschen">×</button>}</label>
      {choice.setting==="kita"&&choice.children>=13&&<div className="rule-notice"><strong>Für große Kita-Gruppen geht es nach draußen.</strong><p>ALBA sieht ab 13 Kindern ausschließlich Outdoor-Spiele vor.</p>{choice.room!=="Outdoor"&&<button className="text-button" onClick={()=>updateChoice("room","Outdoor")}>Unser Angebot findet draußen statt →</button>}</div>}
      {isNovice(choice)&&<div className="rule-notice"><strong>Leichter Einstieg nach ALBAs Vorgaben</strong><p>Wenige Regeln, minimale Vorbereitung, kleine Spiele und die Einstufung „Knaller“. Im neuen Testkatalog erfüllt kein Spiel alle vier Kriterien gleichzeitig.</p></div>}
      {matches.length?<div className="alba-game-grid">{matches.map(match=><GameCard key={match.game.id} match={match} favorite={favorites.includes(match.game.id)} toggle={()=>toggleFavorite(match.game.id)} dismiss={()=>setDismissed(x=>[...x,match.game.id])}/>)}</div>:<div className="empty-state"><h3>{favoritesOnly?"Kein gemerktes Spiel passt gerade":"Diese Kombination ist noch nicht abgedeckt"}</h3><p>{query?"Versuche einen anderen Suchbegriff. ":""}Unter „Warum fehlen Spiele?“ siehst du die konkreten Gründe.</p><button onClick={reset}>Filter zurücksetzen</button></div>}
      {dismissed.length>0&&<button className="text-button" onClick={()=>setDismissed([])}>{dismissed.length} ausgeblendete Spiele wieder berücksichtigen</button>}
      {excluded.length>0&&<details className="exclusions"><summary>Warum fehlen Spiele? <span>{excluded.length} mit abweichenden Anforderungen</span></summary><div>{excluded.map(({game,excluded:reasons})=><article key={game.id}><strong>{game.name}</strong><ul>{reasons.map(x=><li key={x}>{x}</li>)}</ul></article>)}</div></details>}
      {calendar&&<aside className="calendar-card"><div><p className="eyebrow dark">AB 30 MINUTEN</p><h3>Ein roter Faden für eure Einheit.</h3><p>ALBA empfiehlt den {calendar.title}. Dort findest du die Angebote für den aktuellen Monat.</p></div><a href={calendar.href} target="_blank" rel="noreferrer">{calendar.title} öffnen ↗</a></aside>}
    </section>
    <section className="framework-panel" aria-labelledby="framework-title"><div><p className="eyebrow">SPORT VERNETZT · RAHMENWERK</p><h2 id="framework-title">Das Kind<br/><em>im Mittelpunkt.</em></h2><p>Erleben. Weiterentwickeln. Überführen.</p></div><ol>{advice.map((line,i)=><li key={line}><span>{String(i+1).padStart(2,"0")}</span>{line}</li>)}</ol><small>ALBA-Rahmenwerk Kindersport, 12.06.2026 · Seiten 14–18, 21–32</small></section>
    <CoachAI context={choice} recommendations={games} excludedIds={dismissed}/>
    <section className="all-games" id="entdecken" aria-labelledby="all-title"><div className="section-heading"><div><p className="eyebrow dark">WEITER ENTDECKEN</p><h2 id="all-title">Aus der bisherigen Sammlung</h2></div><a href="https://albathek.de" target="_blank" rel="noreferrer">Zur gesamten ALBAthek ↗</a></div><p className="archive-note">Diese acht Spiele bleiben erreichbar. Für die neue Regelprüfung fehlen ihnen noch die detaillierten ALBA-Metadaten; sie werden deshalb nicht automatisch in Einheiten eingeplant.</p>
      <div className="compact-grid">{archive.map(game=><article className="compact-card" key={game.id}><div className="compact-image">
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={game.image} alt="" loading="lazy"/><button className={`favorite ${favorites.includes(game.id)?"is-favorite":""}`} onClick={()=>toggleFavorite(game.id)} aria-label={`${game.title} merken`} aria-pressed={favorites.includes(game.id)}>{favorites.includes(game.id)?"♥":"♡"}</button></div><div><p>{game.type}</p><h3>{game.title}</h3><a href={game.href} target="_blank" rel="noreferrer">Original öffnen ↗</a></div></article>)}</div>
      {!archive.length&&<p>Keine bisherigen Spiele für diese Suche oder Merkliste.</p>}
    </section>
    <footer><div className="wordmark footer-mark"><span>ALBA</span>thek<small>SPORT DIGITAL</small></div><p>{games.length} ALBA-Testspiele + {archiveGames.length} bisherige Spiele · Regelübersicht & SPORT VERNETZT</p><p>Inhalte: © ALBA BERLIN · Import 07.09.2026</p></footer>
  </main>;
}
