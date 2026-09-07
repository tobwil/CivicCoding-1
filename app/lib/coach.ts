import { defaultChoice, normalize, parseSituation, validateChoice, phaseDurations, phases, type Choice, type Plan } from './alba.ts';
import { catalog, catalogMatch, catalogWarnings, family, uniqueFamilies, type CatalogGame } from './catalog.ts';

export type Group = { choice: Choice; interests: string[]; excludedMaterials: string[]; balls: number | null; ballPresent: boolean; noMaterial: boolean; wishes: string[] };
export type Message = { role: 'user' | 'assistant'; text: string; kind?: 'explanation' | 'results' | 'clarification' | 'plan'; };
export type ProviderItem = Record<string, unknown>;
export type Session = { version: 1; group: Group; messages: Message[]; resultIds: string[]; plans: Plan[]; turns: ProviderItem[][]; };
export const sessionKey = 'albathek-coach-dialog-v1';
export const byId = new Map(catalog.map(g => [g.id, g]));
export function newSession(choice: Choice = defaultChoice): Session {
  return { version: 1, group: { choice, interests: [], excludedMaterials: [], balls: null, ballPresent: false, noMaterial: false, wishes: [] }, messages: [], resultIds: [], plans: [], turns: [] };
}
export function restoreSession(raw: string): Session {
  const s = JSON.parse(raw) as Session;
  if (s.version !== 1 || !Array.isArray(s.messages) || !s.messages.every(m => ['user','assistant'].includes(m.role) && typeof m.text === 'string') || !Array.isArray(s.turns) || !Array.isArray(s.plans)) throw Error('Ungültige Sitzung');
  s.group.choice = validateChoice(s.group.choice);
  for (const field of ['interests','excludedMaterials','wishes'] as const) if (!Array.isArray(s.group[field]) || !s.group[field].every(x => typeof x === 'string')) throw Error('Ungültige Gruppe');
  if (!(s.group.balls === null || Number.isInteger(s.group.balls) && s.group.balls >= 0 && s.group.balls <= 100)) throw Error('Ungültige Ballanzahl');
  if (!Array.isArray(s.resultIds) || s.resultIds.some(id => !byId.has(id))) throw Error('Ungültige Treffer');
  if (s.plans.some(p => !p.timeline || p.timeline.length !== 3 || p.timeline.some(t => !byId.has(t.gameId) || !Number.isInteger(t.duration) || t.duration < 1))) throw Error('Ungültiger Plan');
  return s;
}
export function understand(text: string, previous: Group): Group {
  const g = structuredClone(previous), t = normalize(text);
  g.choice = parseSituation(text, g.choice);
  if (/kita/.test(t)) g.choice = { ...g.choice, setting: 'kita', profession: 'educator' };
  if (/grundschule/.test(t)) g.choice.setting = 'grundschule';
  if (/fussball/.test(t) && !g.interests.includes('Fußball')) g.interests.push('Fußball');
  if (/basketball/.test(t) && !g.interests.includes('Basketball')) g.interests.push('Basketball');
  if (/ruhig|ruhiger|schwierig|einfach/.test(t)) g.wishes = [...g.wishes.slice(-7), text.slice(0,200)];
  const ball = t.match(/\b(\d+|ein(?:en)?|zwei|drei)\s+ball(?:e|en)?\b/);
  if (ball) { g.balls = ({ ein:1,einen:1,zwei:2,drei:3 } as Record<string,number>)[ball[1]] ?? Number(ball[1]); g.ballPresent = true; g.noMaterial = false; g.excludedMaterials = g.excludedMaterials.filter(x => x !== 'ball'); }
  else if (/\bball\b/.test(t) && !/kein(?:en)? ball|ohne ball/.test(t)) { g.ballPresent = true; g.noMaterial = false; }
  if (/ohne material|kein material/.test(t)) { g.noMaterial = true; g.ballPresent = false; g.balls = 0; }
  for (const material of ['ball','reifen','hütchen','seil','matte','bank']) {
    if (new RegExp(`(?:ohne|kein(?:e|en)?)\\s+${normalize(material)}`).test(t)) g.excludedMaterials = [...new Set([...g.excludedMaterials, normalize(material)])];
  }
  if (g.excludedMaterials.includes('ball')) { g.balls = 0; g.ballPresent = false; }
  return g;
}
export function materialConflict(game: CatalogGame, group: Group) {
  const m = normalize(game.materials ?? ''), d = normalize(game.description ?? '');
  if (group.noMaterial && m && !/ohne|keine/.test(m)) return true;
  if (group.excludedMaterials.some(x => m.includes(x))) return true;
  // Missing quantities remain unknown. Reject only documented contradictions.
  if (group.balls === 1 && /ball/.test(m) && /(?:jedes kind|alle kinder|pro kind|jedes paar|beide).{0,55}(?:einen|ein|ihre[n]?) (?:hand|fuss|basket|tennis)?ball|ihre balle|mit ballen|mehrere balle|zwei balle|drei balle|\b[2-9] balle/.test(m + ' ' + d)) return true;
  return false;
}
export function findGames(group: Group, query = '', excluded: string[] = []) {
  const terms = normalize([query, ...group.interests].join(' ')).replace(/fussballer\w*/g,'fussball').split(/[^a-z]+/).filter(t => t.length > 3 && !['kinder','meist','minuten','haben','einen','spiel','spiele','sporthalle'].includes(t));
  const ranked = catalog.map(game => {
    const match = catalogMatch(game, { ...group.choice, material: '' });
    const t = normalize(game.title + ' ' + (game.description ?? ''));
    return { game, eligible: match.eligible && !excluded.includes(game.id) && !materialConflict(game,group), score: match.score + terms.filter(x => t.includes(x)).length * 20 + terms.filter(x=>normalize(game.title).includes(x)).length * 10 + (group.balls===1&&/ein(?:en)? (?:fuss|hand|basket)?ball/.test(normalize(game.materials??''))?15:0) + (group.ballPresent && /ball/.test(game.materials ?? '') ? 3 : 0) + (/ruhig|einfach/.test(normalize(query)) && /wahrnehm|gleichgewicht|geschick|kooper/.test(t) ? 35 : 0) };
  }).filter(m => m.eligible).sort((a,b) => b.score-a.score);
  return uniqueFamilies(ranked.map(m => m.game));
}
export function actionFor(text: string): { kind: 'explanation' | 'results' | 'plan'; slot: number | null } {
  const t = normalize(text);
  if (/^(warum|wieso|weshalb|erklar|wie funktioniert|wie geht|wie ist|was bedeutet)|\baufbau\b/.test(t)) return { kind:'explanation',slot:null };
  const change = /ersetz|tausch|andere[srn]? spiel|ruhiger|zu schwierig/.test(t);
  const numbered = t.match(/spiel\s*([123])/);
  const slot = numbered ? Number(numbered[1])-1 : /einstieg|ankommen/.test(t) ? 0 : /hauptteil|action/.test(t) ? 1 : /abschluss|landen/.test(t) ? 2 : null;
  return { kind: change || /einheit|trainingsplan|plan erstellen|plan bauen|wiederhol|vertief/.test(t) ? 'plan' : 'results', slot: change ? slot : null };
}
export function gameReference(text: string, state: Session) {
  const n = normalize(text).match(/spiel\s*([1-6])/);
  const ids = state.plans.at(-1)?.timeline.map(t => t.gameId) ?? state.resultIds;
  return byId.get(ids[n ? Number(n[1])-1 : 0]);
}
export function makePlan(state: Session, text: string, excluded: string[] = [], selected?: string[]): Plan {
  const action = actionFor(text), old = state.plans.at(-1);
  if (action.kind !== 'plan') throw Error('Eine Erklärung darf den Plan nicht verändern.');
  const candidates = findGames(state.group, text, excluded);
  const repeat = /wiederhol|vertief/.test(normalize(text));
  let games: CatalogGame[];
  if (old && action.slot !== null) {
    const keep = old.timeline.filter((_,i) => i !== action.slot).map(t => byId.get(t.gameId)!);
    const replacement = (selected ? selected.map(id => byId.get(id)) : candidates).find(g => g && g.id !== old.timeline[action.slot!].gameId && (repeat || !keep.some(k => family(k) === family(g))));
    if (!replacement) throw Error('Keine passende Alternative gefunden. Der bisherige Plan bleibt erhalten.');
    games = old.timeline.map((t,i) => i === action.slot ? replacement : byId.get(t.gameId)!);
  } else games = selected ? selected.map(id => byId.get(id)!) : candidates.slice(0,3);
  const selectedInvalid=selected?.some(id=>!candidates.some(c=>c.id===id))??false;
  const gameInvalid=games.some(g=>!g||excluded.includes(g.id)||!catalogMatch(g,{...state.group.choice,material:''}).eligible||materialConflict(g,state.group));
  if (games.length !== 3 || selectedInvalid || gameInvalid || !repeat && uniqueFamilies(games).length !== 3) throw Error('Für diese Bedingungen fehlen drei geprüfte, unterschiedliche Spiele. Bitte die Bedingungen ergänzen.');
  const times = old && action.slot !== null ? old.timeline.map(t => t.duration) : phaseDurations(state.group.choice.duration);
  return { headline: `${times.reduce((a,b)=>a+b,0)} Minuten gemeinsam in Bewegung`, read:'Die Reihenfolge und Zeitaufteilung sind Planungsvorschläge, keine ALBA-Originalvorgaben.', coachNote:repeat ? 'Wiederholung zur Vertiefung ausdrücklich gewünscht.' : 'Kurze Erklärungen, viel aktive Zeit und gemeinsame Reflexion.', context: { ...state.group.choice, duration: times.reduce((a,b)=>a+b,0) }, warnings: catalogWarnings(state.group.choice), timeline:games.map((g,i) => old && action.slot !== null && i !== action.slot ? old.timeline[i] : { phase:phases[i],duration:times[i],title:g.title,gameId:g.id,reason:g.description ?? g.audience,tip:'Eigener Coaching-Vorschlag: kurz vormachen, beobachten und die Kinder an Anpassungen beteiligen.' }) };
}
export function planCheck(state: Session) {
  const plan = state.plans.at(-1);
  if (!plan) return [];
  const invalid = plan.timeline.filter(t => { const g = byId.get(t.gameId)!; return !catalogMatch(g,{...state.group.choice,material:''}).eligible || materialConflict(g,state.group); });
  return [...(invalid.length ? ['Der bestehende Plan muss an die neuen Bedingungen angepasst werden: '+invalid.map(t=>t.title).join(', ')] : []), ...(plan.context.children !== state.group.choice.children || plan.context.age !== state.group.choice.age ? ['Gruppendaten wurden geändert. Bitte die Eignung der bestehenden Einheit erneut anhand der Originalanleitungen prüfen.'] : [])];
}
export function localTurn(state: Session, text: string, excluded: string[] = []): Session {
  const next = structuredClone(state); next.group = understand(text,next.group);
  const action = actionFor(text);
  let reply: string;
  if (action.kind === 'explanation') {
    const game = gameReference(text,next);
    reply = game ? `${game.title}\nKatalogbeschreibung: ${game.description || 'Keine Beschreibung verfügbar.'}\nMaterial laut Katalog: ${game.materials || 'Nicht angegeben.'}\nFür den vollständigen Aufbau bitte die Originalanleitung öffnen. Ohne API-Key gibt es hier keine KI-Beratung.` : 'Wähle zunächst ein Spiel aus. Ohne API-Key sind Basissuche und regelbasierte Planung verfügbar.';
  } else {
    next.resultIds = findGames(next.group,text,excluded).slice(0,6).map(g=>g.id);
    if (action.kind === 'plan') {
      try { next.plans.push(makePlan(next,text,excluded)); reply = action.slot !== null ? ['Einstieg','Hauptteil','Abschluss'][action.slot]+' ersetzt; die übrigen Abschnitte und Zeiten bleiben unverändert.' : 'Deine regelbasierte Einheit ist bereit. Bitte Materialmengen und Eignung in den Originalanleitungen prüfen.'; }
      catch (error) { reply = (error as Error).message; }
    } else reply = `${next.resultIds.length} Spielideen aus dem öffentlichen Katalog. ${next.group.balls === 1 ? 'Ein Ball ist übernommen. Bekannte Mengenwidersprüche wurden ausgeschlossen; nicht dokumentierte Mengen bitte im Original prüfen.' : next.group.ballPresent && next.group.balls === null ? 'Ball ist vorhanden. Wie viele Bälle habt ihr?' : 'Du kannst die Bedingungen ergänzen oder eine Einheit erstellen.'} Ohne API-Key: regelbasierte Suche, kein KI-Dialog.`;
  }
  next.messages.push({role:'user',text},{role:'assistant',text:reply,kind:action.kind});
  return next;
}
