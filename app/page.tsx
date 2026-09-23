"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { CoachAI } from './components/CoachAI';
import { catalog, searchCatalog, catalogMatch, type CatalogGame } from './lib/catalog';
import { defaultChoice, type Choice } from './lib/alba';
import { kitaPersonas, kitaRooms, kitaNotices, isKitaPersona } from './lib/kita';

function GameCard({ game, choice, favorite, toggle, dismiss }: { game: CatalogGame; choice: Choice; favorite: boolean; toggle: () => void; dismiss: () => void }) {
  const match = catalogMatch(game, choice), source = game.kita!;
  return <article className="catalog-card" id={'spiel-' + game.id}>
    {game.image && <div className="catalog-image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={game.image} alt="" loading="lazy" width={600} height={400}/>
    </div>}
    <div className="catalog-card-body">
      <div className="catalog-meta"><span>{source.categories.join(' · ') || 'Spielart nicht markiert'}</span><button className="text-button" onClick={toggle} aria-pressed={favorite} aria-label={game.title + (favorite ? ' nicht mehr merken' : ' merken')}>{favorite ? '♥ Gemerkt' : '♡ Merken'}</button></div>
      <h3>{game.title}</h3><p className="audience">{match.reasons.join(' · ')}</p>
      <p className="catalog-description">{game.description || 'Beschreibung fehlt in der Content-Tabelle.'}</p>
      <details className="recipe"><summary>Anleitung & Datenprüfung <span>+</span></summary><div className="recipe-body">
        <p><strong>Material:</strong> {game.materials || 'Nicht angegeben'}</p>
        {source.steps.length ? <ol>{source.steps.map((s,i)=><li key={i}>{s.replace(/^\d+[.)]?\s*/, '')}</li>)}</ol> : <p>Der Ablauf fehlt in der Tabelle. Er wird nicht ergänzt.</p>}
        {source.tip && <p><strong>ALBA-Tipp:</strong> {source.tip}</p>}
        <p><strong>Prüfung für dein Profil:</strong> {match.eligible ? 'Alle eindeutigen Persona- und Gruppenregeln erfüllt.' : match.excluded.join(' ')}</p>
        {!!source.issues.length && <p><strong>Offene Quelldaten:</strong> {source.issues.join(' · ')}</p>}
        <small>Content-Tabelle_Kita.xlsx · Spiele Kita · Zeile {source.sourceRow}</small>
        {game.href ? <p><a href={game.href} target="_blank" rel="noreferrer">ALBA-Original öffnen ↗</a></p> : <p>Kein eindeutig zugeordneter ALBAthek-Link vorhanden.</p>}
        <button className="dismiss-game" onClick={dismiss}>Für heute ausblenden</button>
      </div></details>
    </div>
  </article>;
}

export default function Home() {
  const [choice,setChoice] = useState<Choice>(defaultChoice);
  const [favorites,setFavorites] = useState<string[]>([]), [dismissed,setDismissed] = useState<string[]>([]);
  const [query,setQuery] = useState(''), [favoritesOnly,setFavoritesOnly] = useState(false);
  const [personalized,setPersonalized] = useState(true), [visible,setVisible] = useState(24);
  const resultsRef = useRef<HTMLElement>(null);
  useEffect(()=>{
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('albathek-kita-favorites-v1') ?? '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(saved)) setFavorites(saved.filter((id): id is string => typeof id === 'string' && catalog.some(g=>g.id===id)));
      const persona = localStorage.getItem('albathek-kita-persona-v1');
      if (persona && isKitaPersona(persona)) setChoice(c=>({...c, profession:persona}));
    } catch { /* Browser storage is optional. */ }
  },[]);
  const matches = useMemo(()=>searchCatalog(choice,query).filter(x=>(!personalized || x.eligible) && !dismissed.includes(x.game.id) && (!favoritesOnly || favorites.includes(x.game.id))),[choice,query,personalized,dismissed,favoritesOnly,favorites]);
  function update<K extends keyof Choice>(key: K, value: Choice[K]) {
    setChoice(c=>({...c,[key]:value})); setDismissed([]); setVisible(24); setPersonalized(true);
    if (key === 'profession') try { localStorage.setItem('albathek-kita-persona-v1',String(value)); } catch { /* memory only */ }
  }
  function toggleFavorite(id: string) {
    setFavorites(current=>{const next = current.includes(id) ? current.filter(x=>x!==id) : [...current,id];
      try { localStorage.setItem('albathek-kita-favorites-v1',JSON.stringify(next)); } catch { /* memory only */ } return next;
    });
  }
  function show(personal: boolean) { setPersonalized(personal); setFavoritesOnly(false); setVisible(24); }
  return <main>
    <header className="site-header catalog-header">
      <a className="wordmark" href="#start" aria-label="ALBAthek Startseite"><span>ALBA</span>thek<small>KITA TESTSTAND</small></a>
      <nav aria-label="Hauptnavigation"><a href="#finder" onClick={()=>show(true)}>Für deine Gruppe</a><a href="#entdecken" onClick={()=>show(false)}>KITA-Sammlung</a><a href="#coach-ai">Coach AI ✦</a></nav>
      <button className={'favorites-toggle '+(favoritesOnly?'selected':'')} aria-pressed={favoritesOnly} onClick={()=>{setFavoritesOnly(x=>!x);resultsRef.current?.scrollIntoView({behavior:'smooth'});}}>♡ Gemerkt <span className="favorites-count">{favorites.length}</span></button>
    </header>
    <section className="hero hero-update" id="start"><div className="hero-copy"><p className="eyebrow">ALBA · KITA-PERSONAS</p><h1>Zusammen spielen.<br/><em>Passend zu deiner Kita.</em></h1><p className="hero-lead">Die KITA-Spielesammlung mit den ausgearbeiteten ALBA-Personas erproben.</p></div><div className="catalog-count"><strong>{catalog.length}</strong><span>Spiele & Varianten</span><small>aus der KITA-Content-Tabelle</small></div></section>
    <section className="finder finder-update" id="finder" aria-labelledby="finder-title">
      <div className="finder-heading"><span className="step-badge">01</span><div><p>DEIN PROFIL</p><h2 id="finder-title">Wer leitet das Angebot an?</h2></div></div>
      <label className="field wide"><span>Deine KITA-Persona</span><select value={choice.profession} onChange={e=>update('profession',e.target.value as Choice['profession'])}>{Object.entries(kitaPersonas).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}</select></label>
      <p className="catalog-hint">Das Profil bleibt auf diesem Gerät gespeichert. Es bestimmt Vorbereitung und Spielniveau, nicht die Fähigkeiten einzelner Kinder.</p>
      <div className="finder-heading"><span className="step-badge">02</span><div><p>EURE SITUATION</p><h2>Was passt heute?</h2></div></div>
      <div className="quick-fields">
        <label className="field"><span>Jüngste Kinder</span><input type="number" min={3} max={12} step={.5} value={choice.age} onChange={e=>update('age',Math.max(3,Math.min(12,Number(e.target.value)||3)))}/></label>
        <label className="field"><span>Anzahl Kinder</span><input type="number" min={1} max={100} value={choice.children} onChange={e=>update('children',Math.max(1,Math.min(100,Math.round(Number(e.target.value)||1))))}/></label>
        <label className="field"><span>Ort</span><select value={choice.room} onChange={e=>update('room',e.target.value as Choice['room'])}>{Object.entries(kitaRooms).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label className="field"><span>Zeit in Minuten</span><input type="number" min={10} max={90} value={choice.duration} onChange={e=>update('duration',Math.max(10,Math.min(90,Math.round(Number(e.target.value)||10))))}/></label>
      </div>
      <label className="field"><span>Gewünschtes Material</span><input value={choice.material} maxLength={100} placeholder="z. B. Reifen oder ohne Material" onChange={e=>update('material',e.target.value)}/></label>
      {kitaNotices(choice).map(n=><p role="status" className="catalog-hint" key={n}>{n}</p>)}
      <div className="finder-footer"><p>Zuerst Spiele finden. Im Coach ein Spiel auswählen und eine Themenwelt dazu entwickeln.</p><button className="primary-button" onClick={()=>{show(true);resultsRef.current?.scrollIntoView({behavior:'smooth'});}}>Spielesammlung anzeigen ↘</button></div>
    </section>
    <section className="recommendations" id="entdecken" ref={resultsRef} aria-labelledby="recommendation-title">
      <div className="section-heading"><div><p className="eyebrow dark">KITA-CONTENT-TABELLE · 22.09.2026</p><h2 id="recommendation-title">{favoritesOnly?'Deine Merkliste.':personalized?'Für deine Gruppe.':'Alle Tabellen-Einträge.'}</h2></div><p aria-live="polite">{matches.length} von {catalog.length} Einträgen</p></div>
      <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="KITA-Spiele durchsuchen" placeholder="Spiel, Bewegung oder Material suchen …" value={query} onChange={e=>{setQuery(e.target.value);setVisible(24);}}/></label>
      <div className="catalog-toolbar"><p>{personalized?'Nach ALBA-Persona und Gruppendaten gefiltert.':'Datenprüfung: Auch unvollständige und für dein Profil ungeeignete Einträge sind sichtbar.'}</p><button className="text-button" onClick={()=>{setPersonalized(x=>!x);setVisible(24);}}>{personalized?'Alle Tabellen-Einträge prüfen':'Nur passende Spiele zeigen'}</button></div>
      {matches.length ? <div className="alba-game-grid">{matches.slice(0,visible).map(({game})=><GameCard key={game.id} game={game} choice={choice} favorite={favorites.includes(game.id)} toggle={()=>toggleFavorite(game.id)} dismiss={()=>setDismissed(x=>[...x,game.id])}/>)}</div> : <div className="empty-state"><h3>Keine verlässlich passenden Treffer.</h3><p>Prüfe eure tatsächlichen Rahmenbedingungen oder die offenen Angaben in der Tabelle. Es werden keine Spiele aus dem früheren Gesamtkatalog ergänzt.</p><button onClick={()=>{setPersonalized(false);setQuery('');setFavoritesOnly(false);}}>Tabellen-Einträge prüfen</button></div>}
      {matches.length>visible && <div className="load-more"><button className="primary-button" onClick={()=>setVisible(n=>n+24)}>Weitere Spiele laden ↓</button></div>}
      {!!dismissed.length && <button className="text-button" onClick={()=>setDismissed([])}>Ausgeblendete Spiele wieder zeigen ({dismissed.length})</button>}
    </section>
    <CoachAI context={choice} onPersonaChange={profession=>update('profession',profession)} recommendations={catalog} excludedIds={dismissed} favorites={favorites} toggleFavorite={toggleFavorite}/>
    <section className="alba-lab"><details><summary><span className="trial-tag">DATENGRUNDLAGE</span><span><strong>Was wird hier geprüft?</strong><small>Abgegrenzter KITA-Teststand</small></span><span>+</span></summary><div className="lab-body"><p>Ausschließlich die 129 benannten Einträge der gelieferten Content-Tabelle und vier ausgearbeitete Personas. Der frühere öffentliche Gesamtkatalog und die zehn alten Testprofile sind nicht aktiv.</p><p>Originaltexte bleiben unverändert. Fehlende oder uneindeutige Mindestalter, Gruppengrenzen, Niveau- und Vorbereitungsangaben verhindern eine Empfehlung. Fehlende Abläufe und Materialien werden ausdrücklich angezeigt.</p><p>Die Spaltenbuchstaben im Persona-Dokument passen teilweise nicht zur Tabelle. Die davon abhängigen Ketten- und Einheitenregeln bleiben bis zur Klärung deaktiviert. Auch die widersprüchliche Vorgabe für genau 30 Minuten wird nicht automatisch angewendet.</p></div></details></section>
    <footer><div className="wordmark footer-mark"><span>ALBA</span>thek<small>KITA TESTSTAND</small></div><p>{catalog.length} KITA-Einträge · Vier Personas · Quelle vom 22.09.2026</p><p>Prototyp · Inhalte und Bilder: © ALBA BERLIN</p></footer>
  </main>;
}
