import { isKitaPersona } from './kita.ts';

export const settings = { kita: "Kita" } as const;
export const professions = {
  educator: "Erzieher:in ohne Sportqualifikation",
  novice: "Vereinstrainer:in ohne / mit wenig Kita-Erfahrung",
  educatorSport: "Erzieher:in mit Sportqualifikation in Kita",
  coach: "Vereinstrainer:in mit Erfahrung in Kita",
} as const;
export const rooms = ["Sporthalle", "Bewegungsraum", "Outdoor"] as const;
export const schoolContexts = ["Alle passenden Anlässe"];
export const goals = ["Alle Ziele", "Teamgefühl", "Ballgefühl", "Auspowern", "Koordination"] as const;
export type Choice = {
  useTestProfiles?: boolean;
  setting: keyof typeof settings;
  profession: keyof typeof professions;
  age: number;
  experience: 1 | 2 | 3;
  children: number;
  duration: number;
  room: (typeof rooms)[number];
  schoolContext: string;
  sportswear: boolean;
  goal: (typeof goals)[number];
  material: string;
  preparation: string;
  complexity: string;
  intensity: string;
  social: string;
};
export const defaultChoice: Choice = {
  setting: "kita", profession: "educator", age: 5, experience: 1,
  children: 12, duration: 20, room: "Sporthalle", schoolContext: schoolContexts[0],
  sportswear: true, goal: "Alle Ziele", material: "", preparation: "", complexity: "", intensity: "", social: "",
};
export const noviceProfessions = new Set(["novice", "educator"]);
export function isNovice(choice: Choice) { return noviceProfessions.has(choice.profession); }
export function professionOptions(setting: Choice["setting"]) {
  const keys: Choice["profession"][] = setting === "kita" ? ["educator", "novice", "educatorSport", "coach"] : [];
  return keys;
}
export function normalize(value: string) {
  return value.toLowerCase().replaceAll("ß", "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function validateChoice(value: unknown): Choice {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Bitte die Rahmenbedingungen prüfen.");
  const c = value as Choice;
  const inRange = (n: unknown, low: number, high: number) => typeof n === "number" && Number.isFinite(n) && n >= low && n <= high;
  if (c.setting !== 'kita' || !isKitaPersona(c.profession) || !professionOptions(c.setting).includes(c.profession)
    || (c.useTestProfiles !== undefined && typeof c.useTestProfiles !== "boolean")
    || !inRange(c.age, 3, 12) || !inRange(c.children, 1, 100) || !Number.isInteger(c.children)
    || !inRange(c.duration, 10, 90) || !Number.isInteger(c.duration) || ![1,2,3].includes(c.experience)
    || !rooms.includes(c.room) || !goals.includes(c.goal) || typeof c.sportswear !== "boolean"
    || !schoolContexts.includes(c.schoolContext)
    || !["", "minimal", "wenig", "viel"].includes(c.preparation)
    || !["", "wenig", "mittel", "hoch"].includes(c.complexity)
    || !["", "gering", "mittel", "hoch"].includes(c.intensity)
    || !["", "paar", "allein", "gruppe"].includes(c.social)
    || typeof c.material !== "string" || c.material.length > 100) throw new Error("Bitte gültige Rahmenbedingungen wählen (3–12 Jahre, 1–100 Kinder, 10–90 Minuten).");
  return { ...c, experience: isNovice(c) ? 1 : c.experience, sportswear: c.sportswear, useTestProfiles: false };
}
export type Plan = { headline: string; read: string; coachNote: string; context: Choice; warnings: string[]; timeline: {phase: string; duration: number; title: string; gameId: string; reason: string; tip: string}[] };
export const phases = ["ANKOMMEN", "ACTION", "LANDEN"];
export function phaseDurations(total: number) { const edge = Math.max(2, Math.round(total * .2)); return [edge, total - edge * 2, edge]; }
export function parseSituation(prompt: string, base: Choice): Choice {
  const text = normalize(prompt);
  const c = { ...base };
  const kids = text.match(/(\d+)\s*(?:[a-z]+\s+)?kinder/);
  const age = text.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–]|bis)\s*\d+(?:[.,]\d+)?\s*(?:jahre|jahrig)/) ?? text.match(/(\d+(?:[.,]\d+)?)\s*(?:jahre|jahrig)/);
  const time = text.match(/(\d+)\s*(?:minuten|min\b)/);
  if (kids) c.children = Number(kids[1]);
  if (age) c.age = Number(age[1].replace(",", "."));
  if (time) c.duration = Number(time[1]);
  if (/draussen|outdoor|aussengelande/.test(text)) c.room = "Outdoor";
  else if (/bewegungsraum|funktionsraum|kleine halle|wenig platz/.test(text)) c.room = "Bewegungsraum";
  else if (/sporthalle|halle/.test(text)) c.room = "Sporthalle";
  if (/ohne (?:vorbereitung|aufbau)/.test(text)) c.preparation = "minimal";
  if (/ohne sportkleidung/.test(text)) c.sportswear = false;
  return validateChoice(c);
}
