"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SuggestedGame = {
  id: string;
  title: string;
  href: string;
  image: string;
};

type CoachContext = {
  age: string;
  size: string;
  duration: number;
  goal: string;
  material: string;
};

type TimelineItem = {
  phase: string;
  duration: number;
  title: string;
  gameId: string;
  reason: string;
  tip: string;
};

type CoachPlan = {
  headline: string;
  read: string;
  coachNote: string;
  timeline: TimelineItem[];
};

type Props = {
  context: CoachContext;
  recommendations: SuggestedGame[];
};

const starterPrompts = [
  "25 müde Kinder, kleine Halle, nur zwei Bälle",
  "Die Gruppe ist wild und muss als Team zusammenfinden",
  "Spontane Vertretungsstunde ohne Vorbereitung",
];

function buildDemoPlan(
  prompt: string,
  context: CoachContext,
  games: SuggestedGame[],
): CoachPlan {
  const first = games[0];
  const second = games[1] ?? first;
  const third = games[2] ?? second;
  const total = Math.max(context.duration, 20);
  const warmup = Math.max(4, Math.round(total * 0.2));
  const finish = Math.max(4, Math.round(total * 0.2));
  const main = Math.max(10, total - warmup - finish);

  return {
    headline: "Erst sammeln. Dann zünden.",
    read: `Ich lese aus „${prompt}“: Die Gruppe braucht einen schnellen Einstieg, klare Rollen und ein gemeinsames Erfolgserlebnis.`,
    coachNote:
      "Erkläre nur die erste Runde. Die nächste Regel kommt erst dazu, wenn alle in Bewegung sind.",
    timeline: [
      {
        phase: "ANKOMMEN",
        duration: warmup,
        title: first?.title ?? "Schneller Gruppenstart",
        gameId: first?.id ?? "",
        reason: "holt alle ohne lange Erklärung in die Bewegung",
        tip: "Beginne in Zeitlupe und gib nach 60 Sekunden Tempo frei.",
      },
      {
        phase: "ACTION",
        duration: main,
        title: second?.title ?? "Team-Challenge",
        gameId: second?.id ?? "",
        reason: `verbindet ${context.goal} mit einem klaren gemeinsamen Auftrag`,
        tip: "Wechsle Teams lieber klein und schnell als mit langer Pause.",
      },
      {
        phase: "LANDEN",
        duration: finish,
        title: third?.title ?? "Gemeinsamer Abschluss",
        gameId: third?.id ?? "",
        reason: "nimmt Energie auf und lässt die Einheit positiv enden",
        tip: "Letzte Runde: Die Gruppe entscheidet gemeinsam über eine Regel.",
      },
    ],
  };
}

export function CoachAI({ context, recommendations }: Props) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState("gpt-5.6-luna");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem("albathek-openai-key") ?? "";
    const savedModel =
      window.sessionStorage.getItem("albathek-openai-model") ??
      "gpt-5.6-luna";
    setApiKey(savedKey);
    setModel(savedModel);
    setIsLive(Boolean(savedKey));
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const gameMap = useMemo(
    () => new Map(recommendations.map((game) => [game.id, game])),
    [recommendations],
  );

  function saveSettings() {
    if (apiKey.trim()) {
      window.sessionStorage.setItem("albathek-openai-key", apiKey.trim());
      setIsLive(true);
    } else {
      window.sessionStorage.removeItem("albathek-openai-key");
      setIsLive(false);
    }
    window.sessionStorage.setItem("albathek-openai-model", model);
    setSettingsOpen(false);
    setError("");
  }

  function clearKey() {
    setApiKey("");
    setIsLive(false);
    window.sessionStorage.removeItem("albathek-openai-key");
  }

  async function generatePlan(event: FormEvent) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    setLoading(true);
    setPlan(null);
    setError("");

    try {
      if (!apiKey.trim()) {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
        setPlan(buildDemoPlan(cleanPrompt, context, recommendations));
        return;
      }

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          context,
          apiKey: apiKey.trim(),
          model,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Coach AI ist gerade nicht erreichbar.");
      }
      setPlan(payload.plan);
      setIsLive(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Coach AI ist gerade nicht erreichbar.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="coach-launch" id="coach-ai">
        <div className="coach-launch-orbit" aria-hidden="true">
          <span>✦</span>
        </div>
        <div className="coach-launch-copy">
          <div className="ai-label">
            <span>✦</span> COACH AI
            <small>{isLive ? "OPENAI LIVE" : "DEMO READY"}</small>
          </div>
          <h2>
            Kein Filter.
            <br />
            <em>Einfach erzählen.</em>
          </h2>
          <p>
            „Die Halle ist klein, die Kinder sind laut und ich habe 20
            Minuten.“ Coach AI versteht den Moment und baut daraus deine
            komplette Einheit.
          </p>
          <button type="button" onClick={() => setOpen(true)}>
            Coach AI starten <span>→</span>
          </button>
        </div>
        <div className="coach-launch-card" aria-hidden="true">
          <div className="coach-card-top">
            <span className="coach-pulse" />
            MATCH-LAB / BEREIT
          </div>
          <p>„24 Kinder. Wenig Platz. Viel Energie.“</p>
          <div className="coach-mini-plan">
            <span>05′</span>
            <strong>Ankommen</strong>
            <i />
            <span>14′</span>
            <strong>Action</strong>
            <i />
            <span>05′</span>
            <strong>Landen</strong>
          </div>
          <small>3 Spiele · 1 roter Faden · 0 Leerlauf</small>
        </div>
      </section>

      <button
        type="button"
        className="coach-fab"
        onClick={() => setOpen(true)}
        aria-label="Coach AI öffnen"
      >
        <span>✦</span>
        <strong>COACH AI</strong>
      </button>

      {open && (
        <div className="coach-overlay" role="dialog" aria-modal="true" aria-labelledby="coach-title">
          <div className="coach-shell">
            <header className="coach-header">
              <div className="wordmark coach-wordmark">
                <span>ALBA</span>thek
                <small>SPORT DIGITAL</small>
              </div>
              <div className="coach-status">
                <span className={isLive ? "live" : ""} />
                {isLive ? "OPENAI LIVE" : "DEMO-MODUS"}
              </div>
              <div className="coach-header-actions">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((current) => !current)}
                  aria-label="OpenAI-Einstellungen"
                  aria-expanded={settingsOpen}
                >
                  ⚙ <span>OpenAI</span>
                </button>
                <button
                  type="button"
                  className="coach-close"
                  onClick={() => setOpen(false)}
                  aria-label="Coach AI schließen"
                >
                  ×
                </button>
              </div>
            </header>

            {settingsOpen && (
              <aside className="ai-settings" aria-label="OpenAI-Einstellungen">
                <div className="settings-heading">
                  <div>
                    <p>OPENAI SETTINGS</p>
                    <h3>Mach den Coach live.</h3>
                  </div>
                  <button type="button" onClick={() => setSettingsOpen(false)}>
                    ×
                  </button>
                </div>

                <label>
                  <span>OpenAI API-Key</span>
                  <div className="key-field">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="sk-proj-…"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button type="button" onClick={() => setShowKey((current) => !current)}>
                      {showKey ? "Verbergen" : "Zeigen"}
                    </button>
                  </div>
                </label>

                <label>
                  <span>Modell</span>
                  <select value={model} onChange={(event) => setModel(event.target.value)}>
                    <option value="gpt-5.6-luna">GPT-5.6 Luna · schnell</option>
                    <option value="gpt-5.6-terra">GPT-5.6 Terra · ausgewogen</option>
                    <option value="gpt-5.6">GPT-5.6 · höchste Qualität</option>
                  </select>
                </label>

                <div className="key-note">
                  <span>⌁</span>
                  <p>
                    Der Key bleibt nur in diesem Tab. Bei einer Anfrage wird er
                    serverseitig direkt an OpenAI weitergereicht und nicht
                    gespeichert. Live-Anfragen können Kosten verursachen.
                  </p>
                </div>

                <div className="settings-actions">
                  <button type="button" className="settings-save" onClick={saveSettings}>
                    Für diese Sitzung verwenden
                  </button>
                  {apiKey && (
                    <button type="button" className="settings-clear" onClick={clearKey}>
                      Key entfernen
                    </button>
                  )}
                </div>
              </aside>
            )}

            <div className="coach-workspace">
              <section className="coach-conversation">
                <div className="coach-kicker">
                  <span>02</span> MATCH-LAB
                </div>
                <h2 id="coach-title">
                  Was ist heute
                  <br />
                  <em>wirklich los?</em>
                </h2>
                <p className="coach-subline">
                  Kein Formular. Keine perfekten Angaben. Sag es so, wie es ist.
                </p>

                <form onSubmit={generatePlan}>
                  <label className="coach-prompt">
                    <span className="sr-only">Situation beschreiben</span>
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Zum Beispiel: 25 müde Kinder, kleine Halle und nur zwei Bälle …"
                      rows={4}
                      maxLength={800}
                    />
                    <div>
                      <span>{prompt.length}/800</span>
                      <button type="submit" disabled={loading || !prompt.trim()}>
                        {loading ? "Coach denkt …" : "Einheit bauen"}{" "}
                        <strong>{loading ? "✦" : "→"}</strong>
                      </button>
                    </div>
                  </label>
                </form>

                <div className="starter-prompts">
                  <p>ODER SCHNELL STARTEN MIT</p>
                  {starterPrompts.map((starter) => (
                    <button type="button" key={starter} onClick={() => setPrompt(starter)}>
                      {starter}
                    </button>
                  ))}
                </div>

                <div className="context-ribbon">
                  <span>{context.age}</span>
                  <span>{context.size} Kinder</span>
                  <span>{context.duration} Min.</span>
                  <span>{context.goal}</span>
                  <span>{context.material}</span>
                </div>
              </section>

              <section className={`coach-output ${plan ? "has-plan" : ""}`} aria-live="polite">
                {loading && (
                  <div className="coach-thinking">
                    <div>
                      <span />
                      <span />
                      <span />
                    </div>
                    <p>Ich lese die Energie im Raum …</p>
                    <small>Situation → Dynamik → Spielfluss</small>
                  </div>
                )}

                {!loading && !plan && !error && (
                  <div className="coach-empty">
                    <span>✦</span>
                    <p>Deine Einheit entsteht hier.</p>
                    <small>
                      Coach AI verbindet deine Situation mit passenden
                      ALBAthek-Spielen.
                    </small>
                  </div>
                )}

                {error && !loading && (
                  <div className="coach-error">
                    <span>!</span>
                    <h3>Kurzer Timeout.</h3>
                    <p>{error}</p>
                    <button type="button" onClick={() => setSettingsOpen(true)}>
                      OpenAI-Einstellungen prüfen
                    </button>
                  </div>
                )}

                {plan && !loading && (
                  <div className="generated-plan">
                    <div className="plan-topline">
                      <span>DEIN SPIELPLAN</span>
                      <small>{isLive ? model.toUpperCase() : "DEMO INTELLIGENCE"}</small>
                    </div>
                    <h3>{plan.headline}</h3>
                    <p className="plan-read">{plan.read}</p>
                    <div className="timeline">
                      {plan.timeline.map((item, index) => {
                        const game = gameMap.get(item.gameId);
                        return (
                          <article key={`${item.phase}-${index}`}>
                            <div className="timeline-time">
                              <strong>{String(item.duration).padStart(2, "0")}</strong>
                              <span>MIN</span>
                            </div>
                            <div className="timeline-line">
                              <i />
                            </div>
                            <div className="timeline-content">
                              <p>{item.phase}</p>
                              <h4>{item.title}</h4>
                              <span>{item.reason}</span>
                              <small>COACH-TIPP · {item.tip}</small>
                              {game && (
                                <a href={game.href} target="_blank" rel="noreferrer">
                                  Spiel öffnen ↗
                                </a>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <div className="coach-note">
                      <span>ALBA COACH NOTE</span>
                      <p>„{plan.coachNote}“</p>
                    </div>
                    <button type="button" className="plan-again" onClick={() => setPlan(null)}>
                      Neue Situation <span>↻</span>
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
