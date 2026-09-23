import data from '../data/kita-games.json' with { type: 'json' };
import type { Choice } from './alba.ts';

export const kitaData = data;
export type KitaGame = Omit<(typeof data.records)[number], 'categories'> & { categories: string[] };
export const kitaPersonas = {
  educator: { label: 'Erzieher:in ohne Sportqualifikation', levels: ['Einsteiger'], maxPreparation: 0, support: 'Kurze, schrittweise Anleitung. Eine Spielesammlung anbieten, ein Spiel auswählen lassen, danach eine Themenwelt erfragen. Keine Sportqualifikation voraussetzen.' },
  novice: { label: 'Vereinstrainer:in ohne / mit wenig Kita-Erfahrung', levels: ['Einsteiger'], maxPreparation: 0, support: 'Kita-spezifische Durchführung schrittweise erläutern. Erst Spielesammlung, danach Spielauswahl und Themenwelt. Keine Kita-Erfahrung voraussetzen.' },
  educatorSport: { label: 'Erzieher:in mit Sportqualifikation in Kita', levels: ['Einsteiger', 'Fortgeschrittene'], maxPreparation: 10, support: 'Spielesammlung mit Einsteiger- und Fortgeschrittenen-Spielen. Nach Auswahl eine Themenwelt erfragen. Sportqualifikation nicht mit Kenntnis eines konkreten Spiels gleichsetzen.' },
  coach: { label: 'Vereinstrainer:in mit Erfahrung in Kita', levels: ['Einsteiger', 'Fortgeschrittene', 'Experte'], maxPreparation: 10, support: 'Material, Zeit und gewünschte Spielart klären. Zunächst Spielesammlung. Für 3–4-Jährige ein Spiel auswählen lassen. Die unklaren spaltenbasierten Einheitenregeln sind nicht aktiv.' },
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
  return { excluded, eligible: excluded.length === 0, reasons: [`${game.level ?? 'Niveau offen'}`, `${game.minAge ?? '?'}–${game.maxAge ?? '?'} Jahre`, `${game.minChildren ?? '?'}–${game.maxChildren ?? '?'} Kinder`, game.preparationRaw || 'Vorbereitung offen'] };
}

// Only the category names explicitly described in prose are unambiguous.
// Do not interpret outdated AF/AG/... column references as game categories.
export function followsKita(first: KitaGame, second: KitaGame) {
  const noMaterial = (g: KitaGame) => /^(ohne|kein(?:e)?) material\.?$/.test(norm(g.materials.trim()));
  if (first.id === second.id || first.family === second.family) return false;
  // Advanced chains depend on the unresolved column references in the source.
  if (first.level !== 'Einsteiger' || second.level !== 'Einsteiger') return false;
  if (noMaterial(first)) return noMaterial(second) && first.categories.includes('Laufspiel') && second.categories.includes('Fangspiel');
  const materials = (g: KitaGame) => g.materials.split(/[,;]/).map(x=>norm(x.trim())).filter(Boolean).sort().join('|');
  if (!materials(first) || materials(first) !== materials(second)) return false;
  return first.categories.includes('Materialgewöhnung') && second.categories.includes('Laufspiel') || first.categories.includes('Laufspiel') && second.categories.includes('Materialgewöhnung');
}
