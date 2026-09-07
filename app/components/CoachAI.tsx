"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { settings, type Choice, type Plan } from "../lib/alba";
import { buildCatalogPlan, type CatalogGame } from "../lib/catalog";

type Props = { context: Choice; recommendations: CatalogGame[]; excludedIds: string[] };
const starterPrompts = [
  "12 Kinder, Sporthalle, 20 Minuten – gemeinsam in Bewegung kommen",
  "6 Kinder, 5 Jahre, Bewegungsraum, 15 Minuten",
  "16 Kinder, Outdoor, 30 Minuten – alle sollen mitspielen",
];

export function CoachAI({ context, recommendations, excludedIds }: Props) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState("gpt-5.6-luna");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestId.current += 1;
    controller.current?.abort();
    // A changed group or exclusion invalidates an earlier plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlan(null);
    setLoading(false);
  }, [context, excludedIds]);

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem("albathek-openai-key") ?? "";
    const savedModel =
      window.sessionStorage.getItem("albathek-openai-model") ??
      "gpt-5.6-luna";
    // Browser-only settings are intentionally restored after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(savedKey);
    setModel(savedModel);
    setIsLive(Boolean(savedKey));
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, a[href], summary') ?? []).filter(el => el.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      cancelAnimationFrame(focusFrame);
      previousFocus?.focus();
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const gameMap = useMemo(
    () => new Map(recommendations.map((game) => [game.id, game])),
    [recommendations],
  );

  function saveSettings() {
    controller.current?.abort();
    requestId.current += 1;
    setPlan(null);
    setLoading(false);
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
    controller.current?.abort();
    requestId.current += 1;
    setPlan(null);
    setLoading(false);
    setApiKey("");
    setIsLive(false);
    window.sessionStorage.removeItem("albathek-openai-key");
  }

  async function generatePlan(event: FormEvent) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setPlan(null);
    setError("");

    try {
      if (!apiKey.trim()) {
        const demo = buildCatalogPlan(cleanPrompt, context, excludedIds);
        if (currentRequest === requestId.current) setPlan(demo);
        return;
      }

      controller.current?.abort();
      controller.current = new AbortController();
      try { setPlan(buildCatalogPlan(cleanPrompt, context, excludedIds)); } catch { /* Special constraints need the AI check first. */ }
      const response = await fetch("/api/coach", {
        method: "POST",
        signal: AbortSignal.any([controller.current.signal, AbortSignal.timeout(40000)]),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          context,
          apiKey: apiKey.trim(),
          model,
          excludedIds,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Coach AI ist gerade nicht erreichbar.");
      }
      if (currentRequest !== requestId.current) return;
      setPlan(payload.plan);
      setIsLive(true);
    } catch (requestError) {
      if (currentRequest !== requestId.current) return;
      setPlan(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Coach AI ist gerade nicht erreichbar.",
      );
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
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
            <small>{isLive ? "OPENAI LIVE" : "OFFLINE BEREIT"}</small>
          </div>
          <h2>
            Dein Moment.
            <br />
            <em>Eure Einheit.</em>
          </h2>
          <p>
            „Die Halle ist klein, die Kinder sind laut und ich habe 20
            Minuten.“ Coach AI hilft bei der Auswahl aus dem gesamten ALBAthek-Katalog.
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
          <p>„12 Kinder. Sporthalle. Viel Energie.“</p>
          <div className="coach-mini-plan">
            <span>04′</span>
            <strong>Ankommen</strong>
            <i />
            <span>12′</span>
            <strong>Action</strong>
            <i />
            <span>04′</span>
            <strong>Landen</strong>
          </div>
          <small>ALBA-Spiele · geprüfte Auswahl · ein roter Faden</small>
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
        <div ref={dialogRef} className="coach-overlay" role="dialog" aria-modal="true" aria-labelledby="coach-title">
          <div className="coach-shell">
            <header className="coach-header">
              <div className="wordmark coach-wordmark">
                <span>ALBA</span>thek
                <small>SPORT DIGITAL</small>
              </div>
              <div className="coach-status">
                <span className={isLive ? "live" : ""} />
                {isLive ? "OPENAI LIVE" : "OHNE KI · REGELBASIERT"}
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
                  Drei verschiedene Spiele aus der ALBAthek. Der Sofortplan ist direkt da; mit API-Key ergänzt die KI eure Situation und Praxistipps.
                </p>

                <form onSubmit={generatePlan}>
                  <label className="coach-prompt">
                    <span className="sr-only">Situation beschreiben</span>
                    <textarea
                      value={prompt}
                      onChange={(event) => { controller.current?.abort(); setPrompt(event.target.value); setPlan(null); requestId.current += 1; setLoading(false); }}
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
                    <button type="button" key={starter} onClick={() => { controller.current?.abort(); setPrompt(starter); setPlan(null); requestId.current += 1; setLoading(false); }}>
                      {starter}
                    </button>
                  ))}
                </div>

                <div className="context-ribbon">
                  <span>{settings[context.setting]} · ab {context.age} Jahren</span>
                  <span>{context.children} Kinder</span>
                  <span>{context.duration} Min.</span>
                  <span>{context.goal}</span>
                  <span>{context.room}</span>
                </div>
              </section>

              <section className={`coach-output ${plan ? "has-plan" : ""}`} aria-live="polite">
                {loading && (
                  <div className={plan ? "coach-progress" : "coach-thinking"}>
                    <div>
                      <span />
                      <span />
                      <span />
                    </div>
                    <p>Die KI prüft eure Situation und ergänzt Praxistipps …</p>
                    <button className="text-button" type="button" onClick={()=>{controller.current?.abort();requestId.current+=1;setLoading(false);setIsLive(false);}}>{plan?"Sofortplan behalten":"Anfrage abbrechen"}</button>
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
                    <h3>Diese Einheit braucht noch eine Anpassung.</h3>
                    <p>{error}</p>
                    <button type="button" onClick={() => setSettingsOpen(true)}>
                      OpenAI-Einstellungen prüfen
                    </button>
                  </div>
                )}

                {plan && (
                  <div className="generated-plan">
                    <div className="plan-topline">
                      <span>DEIN SPIELPLAN</span>
                      <small>{loading ? "SOFORTVORSCHLAG · KI PRÜFT NOCH" : isLive ? model.toUpperCase() : "REGELBASIERTER PLAN"}</small>
                    </div>
                    <h3>{plan.headline}</h3>
                    <p className="plan-read">{plan.read}</p>
                    <div className="context-ribbon"><span>Für {plan.context.children} Kinder</span><span>ab {plan.context.age} Jahren</span><span>{plan.context.room}</span><span>{plan.context.duration} Minuten</span></div>
                    {plan.warnings.map(note => <p className="plan-warning" key={note}>{note}</p>)}
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
                                <details><summary>Material & Original öffnen</summary><p><strong>Material:</strong> {game.materials||"Im Original prüfen"}</p><a href={game.href} target="_blank" rel="noreferrer">Video & Anleitung bei ALBA ↗</a>{context.useTestProfiles&&game.profile&&<p>Ergänzendes Testprofil: {game.profile.tip}</p>}</details>
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
                    <button type="button" className="print-plan" onClick={() => window.print()}>Spielplan drucken</button>
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
