import publicData from "../data/public-games.json" with { type: "json" };
import { games as testGames, evaluateGame, normalize, parseSituation, guidance, phaseDurations, phases, type Choice, type Game, type Plan } from "./alba.ts";

export type CatalogGame = {
  id: string; title: string; href: string; image: string; kind: string;
  audience: string; quick: boolean; description?: string; materials?: string;
  fetchedAt?: string; profile?: Game;
};
// Explicit, reviewed identity mapping. Variations do not inherit base-game rules.
const profileIds: Record<string, string> = {
  "Gartenzwerge": "474", "Papprollenangeln": "285",
  "Mäuschen aus dem Haus": "52", "Flaschenkegeln": "64",
  "Zauberball mit mehreren Fangkindern": "75", "Heiße Kartoffel mit Reifen": "50",
  "Jahreszeitenlauf": "269", "Schmuggel-Ei": "633", "Osterhase und Krokodil": "622",
};
export const catalog: CatalogGame[] = publicData.map(game => ({
  ...game, profile: testGames.find(profile => profileIds[profile.name] === game.id),
}));
export { testGames };
export function family(game: CatalogGame) { return new URL(game.href).pathname.split("/")[2]; }
export function uniqueFamilies(items: CatalogGame[]) {
  const seen = new Set<string>();
  return items.filter(game => { const key = family(game); if (seen.has(key)) return false; seen.add(key); return true; });
}
export function catalogMatch(game: CatalogGame, context: Choice) {
  const text = normalize(`${game.title} ${game.description ?? ""} ${game.materials ?? ""}`);
  const reasons: string[] = [];
  const excluded: string[] = [];
  const audience = normalize(game.audience);
  if ((context.setting === "kita" || context.age < 6) && !audience.includes("kita")) excluded.push("Nicht für Kitakinder ausgewiesen");
  if (context.material && !normalize(game.materials ?? "").includes(normalize(context.material))) excluded.push("Material nicht ausgewiesen");
  if (context.setting === "kita" && context.children >= 13 && context.room !== "Outdoor") excluded.push("ALBA-Regel: große Kita-Gruppen nur Outdoor");
  const detail = context.useTestProfiles && game.profile ? evaluateGame(game.profile, context) : null;
  if (detail) excluded.push(...detail.excluded);
  let score = game.kind === "Grundspiel" ? 2 : 0;
  if (game.quick) { score += 2; reasons.push("Schnell vorbereitet"); }
  const targets: Record<string, RegExp> = {
    "Teamgefühl": /team|kooper|gemeinsam|zusammen/,
    "Ballgefühl": /ball|wurf|werfen|fangen|dribbl/,
    "Auspowern": /fangspiel|laufspiel|rennen|schnellig/,
    "Koordination": /gleichgewicht|koordina|geschick|balancier/,
  };
  if (targets[context.goal]?.test(text)) { score += 8; reasons.push(context.goal); }
  return { game, excluded, eligible: !excluded.length, score, reasons };
}
const searchable = new Map(catalog.map(g => [g.id, normalize(`${g.title} ${g.description ?? ""} ${g.materials ?? ""} ${g.audience}`)]));
export function searchCatalog(context: Choice, query = "") {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return catalog.filter(g => terms.every(t => searchable.get(g.id)!.includes(t)))
    .map(g => { const match = catalogMatch(g, context); return { ...match, score: match.score + terms.filter(t=>normalize(g.title).includes(t)).length * 10 + (query && normalize(g.title).startsWith(normalize(query)) ? 20 : 0) }; })
    .sort((a,b) => Number(b.eligible)-Number(a.eligible) || b.score-a.score);
}
export function planCandidates(prompt: string, context: Choice, excludedIds: string[] = []) {
  const terms = normalize(prompt).split(/[^a-z0-9]+/).filter(t => t.length > 3 && !["kinder","jahre","minuten","sporthalle","bewegungsraum","outdoor","gemeinsam","bewegung","kommen","sollen","spielen","heute"].includes(t));
  let matches = searchCatalog(context).filter(m => m.eligible && !excludedIds.includes(m.game.id));
  if (/ohne material/.test(normalize(prompt))) matches = matches.filter(m => /ohne/.test(normalize(m.game.materials ?? "")));
  const ranked = uniqueFamilies(matches.map(m => ({ ...m, relevance: m.score + terms.filter(t => searchable.get(m.game.id)!.includes(t)).length * 5 }))
    .sort((a,b) => b.relevance-a.relevance).map(m => m.game));
  const closing = ranked.filter(g => /gleichgewicht|geschick|wahrnehm|kooper|balancier/i.test(g.title)).slice(0,6);
  return uniqueFamilies([...ranked.slice(0,12), ...closing]);
}
export function catalogWarnings(context: Choice) {
  return ["Planungsvorschlag: Gruppengröße, Platz und Materialmengen anhand der Originalanleitungen prüfen. Der öffentliche Katalog enthält dafür keine vollständigen Detailangaben.",
    ...(context.useTestProfiles ? ["Die zusätzlichen ALBA-Detailprofile und Regelentwürfe befinden sich noch in Erprobung."] : [])];
}
export function buildCatalogPlan(prompt: string, base: Choice, excludedIds: string[] = []): Plan {
  const context = parseSituation(prompt, base);
  if (/nur .*ball|ohne sportkleidung/.test(normalize(prompt))) throw new Error("Diese Material- oder Kleidungsbeschränkung bitte im KI-Modus prüfen lassen. Der Sofortplan kann sie nicht zuverlässig bewerten.");
  const candidates = planCandidates(prompt, context, excludedIds);
  if (candidates.length < 3) throw new Error("Für diese Bedingungen fehlen drei unterschiedliche Spiele. Bitte Filter oder Material prüfen. Es werden keine Spiele doppelt eingesetzt.");
  const first = candidates.find(g => /fangspiel|laufspiel/i.test(g.title)) ?? candidates[0];
  const second = candidates.find(g => g.id !== first.id && /ball|team|wurf/i.test(g.title)) ?? candidates.find(g => g.id !== first.id)!;
  const remaining = candidates.filter(g => g.id !== first.id && g.id !== second.id);
  const third = remaining.find(g => /gleichgewicht|geschick|wahrnehm|kooper|balancier/i.test(g.title)) ?? remaining[0];
  const times = phaseDurations(context.duration);
  return {
    headline: `${context.duration} Minuten. Drei verschiedene Spiele.`,
    read: `Eine erste Auswahl für ${context.children} Kinder. Die Phasen und Spielzeiten sind Vorschläge, keine Zeitvorgaben von ALBA.`,
    coachNote: guidance(context)[2], context, warnings: catalogWarnings(context),
    timeline: [first, second, third].map((g,i) => ({
      phase: phases[i], duration: times[i], title: g.title, gameId: g.id,
      reason: g.description ?? g.audience,
      tip: ["Kurz erklären und vormachen. Alle Kinder früh ins Spielen bringen.", "Spiel beobachten und die Kinder bei Anpassungen beteiligen.", "Die letzte Runde ankündigen, dann gemeinsam sammeln: Was hat euch heute geholfen?"][i],
    })),
  };
}
export function validateCatalogPlan(value: unknown, context: Choice, allowed: CatalogGame[]): Plan {
  const p = value as Plan;
  if (!p || !Array.isArray(p.timeline) || p.timeline.length !== 3 || ![p.headline,p.read,p.coachNote].every(x => typeof x === "string" && x.length <= 1200)) throw new Error("Die KI-Antwort ist unvollständig.");
  const times = phaseDurations(context.duration);
  const selected = p.timeline.map((item,i) => {
    const game = allowed.find(g => g.id === item.gameId);
    if (!game || !catalogMatch(game,context).eligible || item.phase !== phases[i] || ![item.reason,item.tip].every(x => typeof x === "string" && x.length <= 1200)) throw new Error("Die KI hat ein unpassendes Spiel geliefert. Bitte die Bedingungen präzisieren.");
    return game;
  });
  if (uniqueFamilies(selected).length !== 3) throw new Error("Die KI hat ein Spiel mehrfach ausgewählt. Bitte erneut planen; doppelte Spiele werden nicht angezeigt.");
  return { headline:p.headline,read:p.read,coachNote:p.coachNote,context,warnings:catalogWarnings(context),timeline:p.timeline.map((item,i) => ({phase:phases[i],duration:times[i],gameId:selected[i].id,title:selected[i].title,reason:item.reason,tip:item.tip})) };
}
