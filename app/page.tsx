"use client";

import { useEffect, useState } from 'react';
import { CoachAI } from './components/CoachAI';
import { catalog, searchCatalog, catalogMatch, type CatalogGame } from './lib/catalog';
import { defaultChoice, type Choice } from './lib/alba';
import { kitaNotices } from './lib/kita';

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
  const [favorites,setFavorites] = useState<string[]>([]), [dismissed,setDismissed] = useState<string[]>([]);
  const [query,setQuery] = useState(''), [favoritesOnly,setFavoritesOnly] = useState(false);
  const [personalized,setPersonalized] = useState(false), [visible,setVisible] = useState(24);
  useEffect(()=>{
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('albathek-kita-favorites-v1') ?? '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(Array.isArray(saved)) setFavorites(saved.filter((id):id is string=>typeof id==='string'&&catalog.some(g=>g.id===id)));
    } catch { /* Optional device-local bookmarks. */ }
  },[]);
  function toggleFavorite(id:string) {
    setFavorites(current=>{
      const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
      try{localStorage.setItem('albathek-kita-favorites-v1',JSON.stringify(next));}catch{/* memory only */}
      return next;
    });
  }
  function audit(choice:Choice) {
    const matches=searchCatalog(choice,query).filter(x=>(!personalized||x.eligible)&&!dismissed.includes(x.game.id)&&(!favoritesOnly||favorites.includes(x.game.id)));
    return <section className="coach-audit" aria-label="KITA-Datenbasis">
      <h2>Datenbasis prüfen</h2>
      <p>129 Einträge aus der KITA-Content-Tabelle · Vier Personas · Stand 22.09.2026</p>
      <p>Die Prüfung verwendet dieselben Gruppendaten wie dein Gespräch. Hier kannst du auch ungeeignete oder unvollständige Einträge ansehen.</p>
      {kitaNotices(choice).map(n=><p className="dialog-notice" key={n}>{n}</p>)}
      <label className="catalog-search"><input type="search" aria-label="KITA-Tabelle durchsuchen" placeholder="Spiel oder Material suchen …" value={query} onChange={e=>{setQuery(e.target.value);setVisible(24);}}/></label>
      <div className="catalog-toolbar"><button aria-pressed={personalized} onClick={()=>{setPersonalized(x=>!x);setVisible(24);}}>{personalized?'Nur passende Spiele':'Alle Tabellen-Einträge'}</button><button aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(x=>!x)}>♡ Merkliste ({favorites.length})</button><span>{matches.length} Einträge</span></div>
      <div className="alba-game-grid">{matches.slice(0,visible).map(({game})=><GameCard key={game.id} game={game} choice={choice} favorite={favorites.includes(game.id)} toggle={()=>toggleFavorite(game.id)} dismiss={()=>setDismissed(x=>[...x,game.id])}/>)}</div>
      {!matches.length&&<p>Keine Treffer für diese Ansicht. Ändere die Suche oder zeige alle Tabellen-Einträge.</p>}
      {matches.length>visible&&<button onClick={()=>setVisible(n=>n+24)}>Weitere Spiele laden ↓</button>}
      {!!dismissed.length&&<button onClick={()=>setDismissed([])}>Ausgeblendete Spiele wieder zeigen ({dismissed.length})</button>}
      <details className="coach-data-notes"><summary>Grenzen dieses Teststands</summary><p>Originaltexte bleiben unverändert. Fehlende oder uneindeutige Mindestalter, Gruppengrenzen, Niveau- und Vorbereitungsangaben verhindern eine Empfehlung. Fehlende Abläufe und Materialien werden angezeigt.</p><p>Plausible Spaltenzuordnungen und erweiterte Folgespiel-Regeln sind als Annahmen umgesetzt. AP/AR und die automatische Einheit bei 30 Minuten bleiben offen. Es werden keine Spiele aus dem früheren Gesamtkatalog ergänzt.</p></details>
    </section>;
  }
  return <main><CoachAI context={defaultChoice} excludedIds={dismissed} favorites={favorites} toggleFavorite={toggleFavorite} renderAudit={audit}/></main>;
}
