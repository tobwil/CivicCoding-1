import { kitaData, evaluateKita, kitaNotices, type KitaGame } from "./kita.ts";
import { normalize, type Choice } from "./alba.ts";

export type CatalogGame = {
  id: string; title: string; href: string; image: string; kind: string;
  audience: string; quick: boolean; description?: string; materials?: string;
  kita?: KitaGame;
};
export const catalog: CatalogGame[] = kitaData.records.map(game => ({
  id: game.id, title: game.title, href: game.href, image: game.image,
  kind: /K\s*\d+\.\d*[1-9]/.test(game.sourceCode) ? 'Variation' : 'Grundspiel',
  audience: 'KITA · ALBA-Content-Tabelle', quick: game.preparationMinutes === 0,
  description: game.description || game.teaser, materials: game.materials, kita: game,
}));
export function family(game: CatalogGame) { return game.kita?.family ?? game.id; }
export function uniqueFamilies(items: CatalogGame[]) {
  const seen = new Set<string>();
  return items.filter(game => { const key = family(game); if (seen.has(key)) return false; seen.add(key); return true; });
}
export function catalogMatch(game: CatalogGame, context: Choice) {
  const checked = game.kita ? evaluateKita(game.kita, context) : { eligible: false, excluded: ['Nicht im KITA-Testkatalog.'], reasons: [] };
  return { game, ...checked, score: game.quick ? 2 : 0 };
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
  return [...kitaNotices(context), "KITA-Teststand: ausschließlich Content-Tabelle vom 22.09.2026. Fehlende Quelldaten werden nicht ergänzt.", "Die spaltenbasierten Ketten-/Einheitenregeln sind bis zur Klärung mit ALBA nicht aktiv. Zeitaufteilung und freie Einheiten sind eigene Planungsvorschläge."];
}
