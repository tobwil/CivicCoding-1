"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Choice = {
  age: "kita" | "grundschule";
  size: "klein" | "mittel" | "gross";
  duration: 10 | 20 | 30 | 45;
  goal: "Teamgefühl" | "Ballgefühl" | "Auspowern" | "Koordination";
  material: "Ohne" | "Bälle" | "Hütchen" | "Reifen";
};

type Game = {
  id: string;
  title: string;
  href: string;
  image: string;
  audience: Array<Choice["age"]>;
  sizes: Array<Choice["size"]>;
  durations: Array<Choice["duration"]>;
  goals: Array<Choice["goal"]>;
  materials: Array<Choice["material"]>;
  type: string;
  quick: boolean;
  rating?: number;
};

const games: Game[] = [
  {
    id: "6",
    title: "Kartenstaffel: Mit Reifen",
    href: "https://albathek.de/spiele/kartenstaffel-bewegungsspiel-und-memory-im-team/kartenstaffel-mit-reifen",
    image: "/games/kartenstaffel.jpg",
    audience: ["grundschule"],
    sizes: ["mittel", "gross"],
    durations: [20, 30],
    goals: ["Teamgefühl", "Koordination", "Auspowern"],
    materials: ["Reifen", "Hütchen"],
    type: "Variation",
    quick: false,
    rating: 4,
  },
  {
    id: "7",
    title: "Räuberhöhle: Fangspiel und Schatzjagd",
    href: "https://albathek.de/spiele/rauberhohle-fangspiel-und-schatzjagd",
    image: "/games/raeuberhoehle.jpg",
    audience: ["grundschule"],
    sizes: ["mittel", "gross"],
    durations: [20, 30, 45],
    goals: ["Teamgefühl", "Auspowern", "Koordination"],
    materials: ["Hütchen", "Ohne"],
    type: "Grundspiel",
    quick: false,
  },
  {
    id: "10",
    title: "Funiño: Spielwitz im Basketball",
    href: "https://albathek.de/spiele/funino-spielwitz-im-basketball",
    image: "/games/funino.jpg",
    audience: ["grundschule"],
    sizes: ["klein", "mittel"],
    durations: [20, 30, 45],
    goals: ["Ballgefühl", "Teamgefühl", "Koordination"],
    materials: ["Bälle", "Hütchen"],
    type: "Grundspiel",
    quick: true,
  },
  {
    id: "15",
    title: "King Kong kommt: Monströses Fangspiel",
    href: "https://albathek.de/spiele/king-kong-kommt-monstroses-fangspiel",
    image: "/games/king-kong.jpg",
    audience: ["kita", "grundschule"],
    sizes: ["mittel", "gross"],
    durations: [10, 20, 30],
    goals: ["Auspowern", "Koordination"],
    materials: ["Ohne", "Hütchen"],
    type: "Grundspiel",
    quick: true,
  },
  {
    id: "17",
    title: "Gagaball: Zielspiel mit rollenden Bällen",
    href: "https://albathek.de/spiele/gagaball-zielspiel-mit-rollenden-ballen",
    image: "/games/gagaball.jpg",
    audience: ["grundschule"],
    sizes: ["mittel", "gross"],
    durations: [20, 30, 45],
    goals: ["Ballgefühl", "Auspowern", "Koordination"],
    materials: ["Bälle", "Hütchen"],
    type: "Grundspiel",
    quick: false,
  },
  {
    id: "20",
    title: "Schlangendiebe: Schnelles Laufspiel in Teams",
    href: "https://albathek.de/spiele/schlangendiebe-schnelles-laufspiel-in-teams-fur-kinder",
    image: "/games/schlangendiebe.jpg",
    audience: ["grundschule"],
    sizes: ["mittel", "gross"],
    durations: [20, 30],
    goals: ["Teamgefühl", "Auspowern", "Koordination"],
    materials: ["Hütchen", "Ohne"],
    type: "Grundspiel",
    quick: false,
  },
  {
    id: "23",
    title: "Hundehütte: Rasantes Lauf- und Fangspiel",
    href: "https://albathek.de/spiele/hundehutte-rasantes-lauf-und-fangspiel",
    image: "/games/hundehuette.jpg",
    audience: ["grundschule"],
    sizes: ["mittel", "gross"],
    durations: [10, 20, 30],
    goals: ["Auspowern", "Teamgefühl"],
    materials: ["Ohne", "Hütchen"],
    type: "Grundspiel",
    quick: true,
  },
  {
    id: "30",
    title: "Küstenwache: Fangspiel auf hoher See",
    href: "https://albathek.de/spiele/kustenwache-fangspiel-auf-hoher-see",
    image: "/games/kuestenwache.jpg",
    audience: ["kita", "grundschule"],
    sizes: ["mittel", "gross"],
    durations: [10, 20, 30],
    goals: ["Auspowern", "Koordination", "Teamgefühl"],
    materials: ["Ohne", "Hütchen"],
    type: "Grundspiel",
    quick: true,
  },
];

const defaultChoice: Choice = {
  age: "grundschule",
  size: "gross",
  duration: 20,
  goal: "Teamgefühl",
  material: "Hütchen",
};

function scoreGame(game: Game, choice: Choice) {
  let score = 54;
  if (game.audience.includes(choice.age)) score += 12;
  if (game.sizes.includes(choice.size)) score += 8;
  if (game.durations.includes(choice.duration)) score += 9;
  if (game.goals.includes(choice.goal)) score += 11;
  if (game.materials.includes(choice.material)) score += 8;
  if (game.quick && choice.duration <= 20) score += 4;
  if (game.rating) score += game.rating;
  return Math.min(score, 99);
}

function reasonFor(game: Game, choice: Choice) {
  const reasons = [];
  if (game.goals.includes(choice.goal)) reasons.push(`stärkt ${choice.goal}`);
  if (game.sizes.includes(choice.size)) {
    reasons.push(
      choice.size === "gross"
        ? "funktioniert mit großen Gruppen"
        : choice.size === "mittel"
          ? "passt zur Gruppengröße"
          : "ideal für kleine Gruppen",
    );
  }
  if (game.materials.includes(choice.material)) {
    reasons.push(
      choice.material === "Ohne"
        ? "kommt ohne Material aus"
        : `nutzt vorhandene ${choice.material}`,
    );
  }
  if (game.quick && choice.duration <= 20) reasons.push("ist schnell vorbereitet");
  return reasons.slice(0, 2).join(" und ");
}

const optionLabels = {
  size: {
    klein: "bis 12",
    mittel: "13–20",
    gross: "21+",
  },
  age: {
    kita: "Kita",
    grundschule: "Grundschule",
  },
} as const;

export default function Home() {
  const [choice, setChoice] = useState<Choice>(defaultChoice);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("albathek-favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const rankedGames = useMemo(
    () =>
      games
        .filter(
          (game) =>
            !dismissed.includes(game.id) &&
            game.title.toLowerCase().includes(query.toLowerCase()),
        )
        .map((game) => ({
          ...game,
          score: scoreGame(game, choice),
          reason: reasonFor(game, choice),
        }))
        .sort((a, b) => b.score - a.score),
    [choice, dismissed, query],
  );

  function updateChoice<K extends keyof Choice>(key: K, value: Choice[K]) {
    setChoice((current) => ({ ...current, [key]: value }));
    setDismissed([]);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      window.localStorage.setItem("albathek-favorites", JSON.stringify(next));
      return next;
    });
  }

  function showRecommendations() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#start" aria-label="ALBAthek Startseite">
          <span>ALBA</span>thek
          <small>SPORT DIGITAL</small>
        </a>
        <nav aria-label="Hauptnavigation">
          <a href="#empfehlungen">Für dich</a>
          <a href="#entdecken">Alle Spiele</a>
        </nav>
        <div className="header-actions">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Spielideen durchsuchen</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Spiel suchen"
            />
          </label>
          <a className="saved-link" href="#entdecken" aria-label="Gemerkt">
            ♡ <span>{favorites.length || ""}</span>
          </a>
        </div>
      </header>

      <section className="hero" id="start">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <p className="eyebrow">DEINE GRUPPE. DEIN MOMENT. DEIN SPIEL.</p>
          <h1>
            Bewegung, die
            <br />
            <em>zu euch passt.</em>
          </h1>
          <p className="hero-lead">
            Sag uns kurz, was heute möglich ist. Wir finden aus aktuell{" "}
            <strong>857 Spielideen</strong> die besten Treffer für deine Gruppe.
          </p>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>857</span>
          SPIELIDEEN
        </div>
      </section>

      <section className="finder" aria-labelledby="finder-title">
        <div className="finder-heading">
          <span className="step-badge">01</span>
          <div>
            <p>WAS PASST HEUTE?</p>
            <h2 id="finder-title">In 30 Sekunden zum Spiel</h2>
          </div>
          <p className="finder-intro">
            Deine Auswahl verändert die Empfehlungen sofort.
          </p>
        </div>

        <div className="choice-grid">
          <fieldset>
            <legend>
              <span>1</span> Altersgruppe
            </legend>
            <div className="segmented">
              {(["kita", "grundschule"] as const).map((value) => (
                <button
                  type="button"
                  className={choice.age === value ? "active" : ""}
                  onClick={() => updateChoice("age", value)}
                  aria-pressed={choice.age === value}
                  key={value}
                >
                  {optionLabels.age[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>2</span> Kinder
            </legend>
            <div className="segmented three">
              {(["klein", "mittel", "gross"] as const).map((value) => (
                <button
                  type="button"
                  className={choice.size === value ? "active" : ""}
                  onClick={() => updateChoice("size", value)}
                  aria-pressed={choice.size === value}
                  key={value}
                >
                  {optionLabels.size[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>3</span> Zeit
            </legend>
            <div className="segmented four">
              {([10, 20, 30, 45] as const).map((value) => (
                <button
                  type="button"
                  className={choice.duration === value ? "active" : ""}
                  onClick={() => updateChoice("duration", value)}
                  aria-pressed={choice.duration === value}
                  key={value}
                >
                  {value}
                  <small>min</small>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="wide-choice">
            <legend>
              <span>4</span> Ziel
            </legend>
            <div className="chip-row">
              {(
                [
                  "Teamgefühl",
                  "Ballgefühl",
                  "Auspowern",
                  "Koordination",
                ] as const
              ).map((value) => (
                <button
                  type="button"
                  className={choice.goal === value ? "active" : ""}
                  onClick={() => updateChoice("goal", value)}
                  aria-pressed={choice.goal === value}
                  key={value}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="wide-choice">
            <legend>
              <span>5</span> Material
            </legend>
            <div className="chip-row">
              {(["Ohne", "Bälle", "Hütchen", "Reifen"] as const).map(
                (value) => (
                  <button
                    type="button"
                    className={choice.material === value ? "active" : ""}
                    onClick={() => updateChoice("material", value)}
                    aria-pressed={choice.material === value}
                    key={value}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
          </fieldset>
        </div>

        <div className="finder-footer">
          <p>
            <span>✓</span> {optionLabels.age[choice.age]} ·{" "}
            {optionLabels.size[choice.size]} Kinder · {choice.duration} Min. ·{" "}
            {choice.goal} · {choice.material}
          </p>
          <button type="button" className="primary-button" onClick={showRecommendations}>
            Meine Spiele zeigen <span>↘</span>
          </button>
        </div>
      </section>

      <section
        className="recommendations"
        id="empfehlungen"
        ref={resultsRef}
        aria-labelledby="recommendation-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">FÜR DICH AUSGEWÄHLT</p>
            <h2 id="recommendation-title">
              Das passt <em>heute.</em>
            </h2>
          </div>
          <p>
            Neu sortiert nach deinen Bedingungen
            <span className="live-dot">LIVE</span>
          </p>
        </div>

        {rankedGames.length ? (
          <div className="featured-grid">
            {rankedGames.slice(0, 3).map((game, index) => (
              <article className={`game-card featured featured-${index + 1}`} key={game.id}>
                <div className="image-wrap">
                  <img src={game.image} alt="" />
                  <span className="match-badge">{game.score}% Match</span>
                  <button
                    type="button"
                    className={`favorite ${favorites.includes(game.id) ? "is-favorite" : ""}`}
                    onClick={() => toggleFavorite(game.id)}
                    aria-label={
                      favorites.includes(game.id)
                        ? `${game.title} nicht mehr merken`
                        : `${game.title} merken`
                    }
                  >
                    {favorites.includes(game.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span>{game.type}</span>
                    {game.quick && <span>Blitzschnell</span>}
                  </div>
                  <h3>{game.title}</h3>
                  <p className="match-reason">
                    <span>✓</span> Passt, weil es {game.reason}.
                  </p>
                  <div className="card-actions">
                    <a href={game.href} target="_blank" rel="noreferrer">
                      Spiel ansehen <span>↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setDismissed((current) => [...current, game.id])
                      }
                    >
                      Passt nicht
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Kein Spiel gefunden</h3>
            <p>Versuche einen anderen Suchbegriff oder setze die Auswahl zurück.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDismissed([]);
                setChoice(defaultChoice);
              }}
            >
              Auswahl zurücksetzen
            </button>
          </div>
        )}
      </section>

      <section className="all-games" id="entdecken" aria-labelledby="all-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">WEITER ENTDECKEN</p>
            <h2 id="all-title">Mehr Ideen für euch</h2>
          </div>
          <a href="https://albathek.de/filter/6cde4a43" target="_blank" rel="noreferrer">
            Alle 857 in der ALBAthek <span>↗</span>
          </a>
        </div>

        <div className="compact-grid">
          {rankedGames.slice(3, showAll ? rankedGames.length : 7).map((game) => (
            <article className="compact-card" key={game.id}>
              <div className="compact-image">
                <img src={game.image} alt="" />
                <button
                  type="button"
                  className={`favorite ${favorites.includes(game.id) ? "is-favorite" : ""}`}
                  onClick={() => toggleFavorite(game.id)}
                  aria-label={`${game.title} merken`}
                >
                  {favorites.includes(game.id) ? "♥" : "♡"}
                </button>
              </div>
              <div>
                <p>{game.type}</p>
                <h3>{game.title}</h3>
                <a href={game.href} target="_blank" rel="noreferrer">
                  Öffnen <span>↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        {rankedGames.length > 7 && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? "Weniger anzeigen" : "Mehr Vorschläge anzeigen"}
          </button>
        )}
      </section>

      <section className="idea-strip">
        <p>NOCH NICHTS PASSENDES?</p>
        <h2>Beschreib deine Situation in einem Satz.</h2>
        <div className="prompt-mock">
          <span>
            „25 müde Kinder, kleine Halle und nur zwei Bälle …“
          </span>
          <button type="button" aria-label="Eingabe absenden">
            →
          </button>
        </div>
        <small>Konzeptvorschau · Freie Suche als nächste Ausbaustufe</small>
      </section>

      <footer>
        <div className="wordmark footer-mark">
          <span>ALBA</span>thek
          <small>SPORT DIGITAL</small>
        </div>
        <p>
          Interaktiver Personalisierungs-Prototyp mit aktuellen, öffentlich
          verlinkten ALBAthek-Inhalten.
        </p>
        <p>Inhalte: © ALBA BERLIN · Datenstand 27.07.2026</p>
      </footer>
    </main>
  );
}
