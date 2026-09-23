import data from '../data/kita-games.json' with { type: 'json' };
import type { Choice } from './alba.ts';

export const kitaData = data;
export type KitaGame = Omit<(typeof data.records)[number], 'categories'> & { categories: string[] };
// Approved implementation assumption: the persona references precede a ten-column
// shift. Use semantic field names at runtime, not a blanket arithmetic conversion.
// AP and AR would map to preparation/outdoors, so they remain unresolved categories.
export const kitaColumnAssumptions = {
  S: { column: 'I', field: 'Materialien' },
  AF: { column: 'V', field: 'Fangspiel' },
  AG: { column: 'W', field: 'Laufspiel' },
  AH: { column: 'X', field: 'Zielwurfspiel' },
  AJ: { column: 'Z', field: 'Ballspiele' },
  AK: { column: 'AA', field: 'Kraft- und Gewandheitsspiele' },
  AM: { column: 'AC', field: 'Überbrückungsspiel' },
  AN: { column: 'AD', field: 'Materialgewöhnung' },
  AO: { column: 'AE', field: 'Laufschule' },
} as const;
export const kitaRuleNotice = 'Die plausiblen Spaltenbezüge sind als dokumentierte Annahmen über benannte Felder umgesetzt. AP/AR und die automatische 30-Minuten-Einheit bleiben offen. Freie Einheiten und ihre Zeitaufteilung sind eigene Planungsvorschläge.';
const category = (key: Exclude<keyof typeof kitaColumnAssumptions, 'S'>): string => kitaColumnAssumptions[key].field;
const educatorChainCategories = (['AF','AG','AH','AK','AO'] as const).map(category);
const coachChainCategories = (['AF','AG','AH','AK'] as const).map(category);
const coachYoungCategories = (['AF','AG','AH','AJ','AN','AO'] as const).map(category);
const coachShortCategories = (['AF','AG','AH','AK','AO','AN'] as const).map(category);
export const kitaPersonas = {
  educator: { label: 'Erzieher:in ohne Sportqualifikation', levels: ['Einsteiger'], maxPreparation: 0, support: 'Kurze, schrittweise Anleitung. Eine Spielesammlung anbieten, ein Spiel auswählen lassen, danach eine Themenwelt erfragen. Keine Sportqualifikation voraussetzen.' },
  novice: { label: 'Vereinstrainer:in ohne / mit wenig Kita-Erfahrung', levels: ['Einsteiger'], maxPreparation: 0, support: 'Kita-spezifische Durchführung schrittweise erläutern. Erst Spielesammlung, danach Spielauswahl und Themenwelt. Keine Kita-Erfahrung voraussetzen.' },
  educatorSport: { label: 'Erzieher:in mit Sportqualifikation in Kita', levels: ['Einsteiger', 'Fortgeschrittene'], maxPreparation: 10, support: 'Spielesammlung mit Einsteiger- und Fortgeschrittenen-Spielen. Nach Auswahl eine Themenwelt erfragen. Sportqualifikation nicht mit Kenntnis eines konkreten Spiels gleichsetzen.' },
  coach: { label: 'Vereinstrainer:in mit Erfahrung in Kita', levels: ['Einsteiger', 'Fortgeschrittene', 'Experte'], maxPreparation: 10, support: 'Material, Zeit und gewünschte Spielart klären. Zunächst Spielesammlung. Für 3–4-Jährige einschließlich Zwischenalter ein Spiel auswählen lassen. Rekonstruierte Kategorieauswahl und Folgespiel-Regeln sind aktiv; automatische Einheiten sowie AP/AR bleiben offen.' },
} as const;
export const kitaRooms = { Sporthalle: 'Sporthalle', Bewegungsraum: 'Funktionsraum Kita', Outdoor: 'Außengelände' } as const;
export const isKitaPersona = (value: string): value is keyof typeof kitaPersonas => Object.hasOwn(kitaPersonas, value);
const norm = (s: string) => s.toLowerCase().replaceAll('ß','ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function kitaNotices(c: Choice) {
  return [
    ...(c.age > 6 ? ['Für diese Altersklasse sind im KITA-Teststand keine Spiele vorgesehen (bis 6 Jahre).'] : []),
    ...(c.room === 'Bewegungsraum' && c.children > 12 ? ['Mehr als 12 Kinder: Bitte das Angebot in der Sporthalle oder auf dem Außengelände durchführen.'] : []),
  ];
}
export function evaluateKita(game: KitaGame, c: Choice) {
  const excluded = [...kitaNotices(c)];
  const persona = isKitaPersona(c.profession) ? kitaPersonas[c.profession] : null;
  if (c.setting !== 'kita' || !persona) excluded.push('Nur die vier ausgearbeiteten KITA-Personas sind freigegeben.');
  if (game.minAge === null) excluded.push('Mindestalter fehlt oder ist uneindeutig.');
  else if (game.minAge > 6 || game.minAge > c.age) excluded.push(`Mindestalter: ${game.minAge} Jahre.`);
  if (game.maxAge !== null && c.age > game.maxAge) excluded.push(`Höchstalter: ${game.maxAge} Jahre.`);
  if (game.minChildren === null || game.maxChildren === null) excluded.push('Gruppengröße nicht vollständig dokumentiert.');
  else {
    if (c.children < game.minChildren) excluded.push(`Mindestens ${game.minChildren} Kinder.`);
    if (c.children > game.maxChildren) excluded.push(`Höchstens ${game.maxChildren} Kinder.`);
  }
  if (!game.level) excluded.push('Niveau fehlt oder ist uneindeutig.');
  else if (persona && !(persona.levels as readonly string[]).includes(game.level)) excluded.push(`Niveau ${game.level} passt nicht zum Persona-Regelsatz.`);
  if (game.preparationMinutes === null) excluded.push('Vorbereitungszeit fehlt oder ist uneindeutig.');
  else if (persona && game.preparationMinutes > persona.maxPreparation) excluded.push(persona.maxPreparation === 0 ? 'Diese Persona benötigt minimale Vorbereitung.' : 'Mehr als 10 Minuten Vorbereitung.');
  if (c.room === 'Outdoor' && (game.outdoors !== true || !game.categories.some(x => ['Laufspiel','Fangspiel'].includes(x)))) excluded.push('Draußen und Lauf-/Fangspiel müssen eindeutig markiert sein.');
  if (c.material && !norm(game.materials).includes(norm(c.material))) excluded.push('Gewünschtes Material nicht ausgewiesen.');
  // Interpret the source's "age = 3, 4" as the continuous 3–4-year interval.
  // At >=30 minutes for older children the conflicting automatic rules stay off.
  const coachCategories = c.profession === 'coach' ? (c.age < 5 ? coachYoungCategories : c.duration < 30 ? coachShortCategories : null) : null;
  if (coachCategories && !game.categories.some(x => coachCategories.includes(x))) excluded.push('Spielkategorie passt nicht zur rekonstruierten Alters-/Zeitregel der Trainer-Persona.');
  return { excluded, eligible: excluded.length === 0, reasons: [`${game.level ?? 'Niveau offen'}`, `${game.minAge ?? '?'}–${game.maxAge ?? '?'} Jahre`, `${game.minChildren ?? '?'}–${game.maxChildren ?? '?'} Kinder`, game.preparationRaw || 'Vorbereitung offen'] };
}

export function followsKita(first: KitaGame, second: KitaGame, profession: string = 'educator') {
  const noMaterial = (g: KitaGame) => /^(ohne|kein(?:e)?) material\.?$/.test(norm(g.materials.trim()));
  if (!isKitaPersona(profession) || first.id === second.id || first.family === second.family) return false;
  const levels: readonly string[] = kitaPersonas[profession].levels;
  if (!first.level || !second.level || !levels.includes(first.level) || !levels.includes(second.level)) return false;
  const materials = (g: KitaGame) => g.materials.split(/[,;]/).map(x=>norm(x.trim())).filter(Boolean).sort().join('|');
  const neither = noMaterial(first) && noMaterial(second);
  if (!neither && (noMaterial(first) || noMaterial(second) || !materials(first) || materials(first) !== materials(second))) return false;
  // Conservative reading of Profession 2: after an advanced game, only a beginner
  // running/running-school/bridging game; never two advanced games in succession.
  if (profession === 'educatorSport' && (first.level === 'Fortgeschrittene' || second.level === 'Fortgeschrittene')) {
    return second.level === 'Einsteiger' && second.categories.some(x => [category('AO'),category('AG'),category('AM')].includes(x));
  }
  const simple = neither
    ? first.categories.includes('Laufspiel') && second.categories.includes('Fangspiel')
    : first.categories.includes('Materialgewöhnung') && second.categories.includes('Laufspiel') || first.categories.includes('Laufspiel') && second.categories.includes('Materialgewöhnung');
  if (simple) return true;
  const pool = profession === 'educatorSport' ? educatorChainCategories : profession === 'coach' ? coachChainCategories : [];
  const left = first.categories.filter(x => pool.includes(x));
  const right = second.categories.filter(x => pool.includes(x));
  // Multi-tagged games must not share a category in this pool; otherwise the
  // advertised category change would be ambiguous.
  return left.length > 0 && right.length > 0 && !left.some(x => right.includes(x));
}
