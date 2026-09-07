import sourceGames from "../data/alba-games.json" with { type: "json" };
import legacyGames from "../data/legacy-games.json" with { type: "json" };

export const games = sourceGames;
export const archiveGames = legacyGames;
export type Game = (typeof games)[number];
export const settings = { kita: "Kita", grundschule: "Grundschule", verein: "Verein" } as const;
export const professions = {
  coach: "Vereinstrainer:in mit Praxiserfahrung",
  novice: "Vereinstrainer:in ohne / mit wenig Erfahrung",
  educator: "Erzieher:in ohne Sportqualifikation",
  educatorSport: "Erzieher:in mit Sportqualifikation",
  teacher: "Lehrer:in ohne Sportqualifikation",
  sportTeacher: "Sportlehrer:in",
  other: "Sonstiges pädagogisches Personal",
} as const;
export const rooms = ["Sporthalle", "Bewegungsraum", "Outdoor"] as const;
export const schoolContexts = ["Alle passenden Anlässe", "Offener Anfang mit Bewegung", "Aufwärmen für den Schulstart", "Bewegter Fachunterricht", "Aktive Pause im Unterricht", "Sport in kleinen & großen Pausen", "Sportunterricht", "Sport-AG", "Übergang in den Vereinssport", "Sportliches Highlight", "Feriensport", "Übergang Kita x Grundschule"];
export const goals = ["Alle Ziele", "Teamgefühl", "Ballgefühl", "Auspowern", "Koordination"] as const;
export type Choice = {
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
  setting: "grundschule", profession: "coach", age: 7, experience: 1,
  children: 12, duration: 20, room: "Sporthalle", schoolContext: schoolContexts[0],
  sportswear: true, goal: "Alle Ziele", material: "", preparation: "", complexity: "", intensity: "", social: "",
};
export const noviceProfessions = new Set(["novice", "educator", "teacher", "other"]);
export function isNovice(choice: Choice) { return noviceProfessions.has(choice.profession); }
export function professionOptions(setting: Choice["setting"]) {
  const keys: Choice["profession"][] = setting === "verein" ? ["coach", "novice"] : setting === "kita" ? ["coach", "novice", "educator", "educatorSport"] : Object.keys(professions) as Choice["profession"][];
  return keys;
}
export function normalize(value: string) {
  return value.toLowerCase().replaceAll("ß", "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function normalizeSchool(value: string) {
  const v = normalize(value);
  if (v.includes("ubergang") && (v.includes("kita") || v.includes("gs"))) return "Übergang Kita x Grundschule";
  if (v.includes("pause") && (v.includes("klein") || v.includes("gross"))) return "Sport in kleinen & großen Pausen";
  return schoolContexts.find(x => normalize(x) === v) ?? value.trim();
}
export function allowedSchoolContexts(choice: Choice): string[] {
  if (!isNovice(choice)) return schoolContexts;
  const common = ["Aufwärmen für den Schulstart", "Aktive Pause im Unterricht", "Sport in kleinen & großen Pausen"];
  if (choice.profession === "novice") return ["Alle passenden Anlässe", "Sport-AG", "Sport in kleinen & großen Pausen", "Übergang in den Vereinssport", "Sportliches Highlight"];
  if (choice.profession === "teacher") return ["Alle passenden Anlässe", ...common, "Bewegter Fachunterricht", "Sportunterricht", "Sportliches Highlight"];
  return ["Alle passenden Anlässe", ...common, "Offener Anfang mit Bewegung", "Feriensport"];
}
export function validateChoice(value: unknown): Choice {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Bitte die Rahmenbedingungen prüfen.");
  const c = value as Choice;
  const inRange = (n: unknown, low: number, high: number) => typeof n === "number" && Number.isFinite(n) && n >= low && n <= high;
  if (!Object.hasOwn(settings,c.setting) || !Object.hasOwn(professions,c.profession) || !professionOptions(c.setting).includes(c.profession)
    || !inRange(c.age, 3, 12) || !inRange(c.children, 1, 100) || !Number.isInteger(c.children)
    || !inRange(c.duration, 10, 90) || !Number.isInteger(c.duration) || ![1,2,3].includes(c.experience)
    || !rooms.includes(c.room) || !goals.includes(c.goal) || typeof c.sportswear !== "boolean"
    || !schoolContexts.includes(c.schoolContext)
    || !["", "minimal", "wenig", "viel"].includes(c.preparation)
    || !["", "wenig", "mittel", "hoch"].includes(c.complexity)
    || !["", "gering", "mittel", "hoch"].includes(c.intensity)
    || !["", "paar", "allein", "gruppe"].includes(c.social)
    || typeof c.material !== "string" || c.material.length > 100) throw new Error("Bitte gültige Rahmenbedingungen wählen (3–12 Jahre, 1–100 Kinder, 10–90 Minuten).");
  return { ...c, experience: isNovice(c) ? 1 : c.experience, sportswear: c.setting === "verein" ? true : c.sportswear };
}
export function minimumAge(game: Game, choice: Choice) {
  const level = isNovice(choice) ? 1 : choice.experience;
  return [game.ageNew, game.ageGuided, game.ageIndependent][level - 1];
}
export function maximumChildren(game: Game, choice: Choice) {
  // ALBA specifies one quarter of the hall capacity in a Kita movement room.
  return choice.setting === "kita" && choice.room === "Bewegungsraum" ? Math.floor(game.maxChildren / 4) : game.maxChildren;
}
export function gameGoals(game: Game) {
  const text = normalize([game.category, game.description, game.technique, game.social].join(" "));
  return [
    ...(text.includes("team") || text.includes("zusammen") ? ["Teamgefühl"] : []),
    ...(text.includes("ball") || text.includes("wurf") || text.includes("rollspiel") ? ["Ballgefühl"] : []),
    ...(game.intensity === "hoch" || /fangspiel|laufspiel/.test(text) ? ["Auspowern"] : []),
    "Koordination",
  ];
}
export function evaluateGame(game: Game, choice: Choice) {
  const excluded: string[] = [];
  const notes: string[] = [];
  const age = minimumAge(game, choice);
  if (age > choice.age) excluded.push(`Ab ${age} Jahren in der gewählten Erfahrungsstufe`);
  if (choice.setting === "kita" && (choice.age >= 9 || age >= 9)) excluded.push("Kita-Angebote für Kinder unter 9 Jahren");
  if (choice.setting === "grundschule" && game.ageIndependent <= 4) excluded.push("Reines Angebot für 3–4-Jährige");
  if (game.minChildren === null) notes.push("Mindestgruppengröße von ALBA nicht angegeben");
  else if (choice.children < game.minChildren) excluded.push(`Mindestens ${game.minChildren} Kinder`);
  const max = maximumChildren(game, choice);
  if (choice.children > max) excluded.push(`Maximal ${max} Kinder${choice.setting === "kita" && choice.room === "Bewegungsraum" ? " im Bewegungsraum (¼ Hallenkapazität)" : " auf einem Basketballfeld"}`);
  if (choice.setting === "kita" && choice.children >= 13 && choice.room !== "Outdoor") excluded.push("Kita-Gruppen ab 13 Kindern: nur Outdoor");
  const location = normalize(game.kitaContext);
  if (!(choice.room === "Bewegungsraum" ? /bew\.raum|bewegungsraum/.test(location) : location.includes(normalize(choice.room)))) excluded.push(`Für ${choice.room} nicht ausgewiesen`);
  if (location.includes("klein") && choice.room === "Bewegungsraum" && choice.children > 12) excluded.push("Bewegungsraum nur mit kleiner Gruppe (bis 12 Kinder)");
  if (!choice.sportswear && game.sportswear !== "nein") excluded.push(game.sportswear === "ja" ? "Sportkleidung erforderlich" : "Sportkleidung: Angabe fehlt");
  if (game.sportswear === null) notes.push("Sportkleidung nicht angegeben");
  if (isNovice(choice)) {
    if (game.rules !== "wenig") excluded.push("Einstieg: wenige Regeln benötigt");
    if (game.preparation !== "minimal") excluded.push("Einstieg: minimale Vorbereitung benötigt");
    if (game.attractiveness !== "Knaller") excluded.push("Einstieg: ALBA-Einstufung „Knaller“ benötigt");
    if (game.form !== "Kleines Spiel") excluded.push("Einstieg: nur kleine Spiele");
  }
  if (choice.profession === "educatorSport" && (game.rules === "hoch" || game.form !== "Kleines Spiel")) excluded.push("Sportqualifizierte Erzieher:innen: kleine Spiele mit wenigen / mittleren Regeln");
  const contexts = game.schoolContext.split(",").map(normalizeSchool);
  if (choice.setting === "grundschule") {
    if (isNovice(choice) && !contexts.some(x => allowedSchoolContexts(choice).includes(x))) excluded.push("Anlass passt nicht zur gewählten Profession");
    if (choice.schoolContext !== schoolContexts[0] && !contexts.includes(choice.schoolContext)) excluded.push("Nicht für diesen Bewegungsanlass ausgewiesen");
  }
  if (choice.schoolContext === "Übergang Kita x Grundschule" && choice.setting !== "verein") {
    if (isNovice(choice)) excluded.push("Übergang Kita × Grundschule setzt Erfahrung voraus");
    if (game.preparation === "viel" || game.rules === "hoch") excluded.push("Übergang: wenig Vorbereitung und wenige / mittlere Regeln");
    if (game.maxChildren <= 10) excluded.push("Übergang: für größere Gruppen geeignet");
  }
  const prep = ["minimal", "wenig", "viel"];
  if (choice.preparation && prep.indexOf(game.preparation) > prep.indexOf(choice.preparation)) excluded.push("Mehr Vorbereitung als ausgewählt");
  const rules = ["wenig", "mittel", "hoch"];
  if (choice.complexity && rules.indexOf(game.rules) > rules.indexOf(choice.complexity)) excluded.push("Mehr Regeln als ausgewählt");
  if (choice.intensity && choice.intensity !== game.intensity) excluded.push("Andere Intensität");
  if (choice.social && !normalize(game.social).includes(choice.social)) excluded.push("Andere Sozialform");
  if (choice.material && !normalize(game.materials).includes(normalize(choice.material))) excluded.push("Gewünschtes Material nicht enthalten");
  const matchesGoal = choice.goal === "Alle Ziele" || gameGoals(game).includes(choice.goal);
  const score = (matchesGoal ? 4 : 0) + (game.attractiveness === "Knaller" ? 2 : 0) + (game.preparation === "minimal" ? 2 : game.preparation === "wenig" ? 1 : 0);
  const reason = [`ab ${age} Jahren`, `bis ${max} Kinder`, game.preparation === "minimal" ? "sofort vorbereitet" : game.preparation === "wenig" ? "bis 5 Min. Vorbereitung" : "ca. 10 Min. Vorbereitung"];
  return { game, excluded, notes, score, reason, eligible: excluded.length === 0 };
}
export type Match = ReturnType<typeof evaluateGame>;
export function findGames(choice: Choice, query = "") {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return games.map(game => evaluateGame(game, choice))
    .filter(({game}) => terms.every(term => normalize(Object.values(game).flat().join(" ") + " " + gameGoals(game).join(" ")).includes(term)))
    .sort((a,b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.game.name.localeCompare(b.game.name, "de"));
}
export function guidance(choice: Choice) {
  const points = ["Viel Bewegungszeit für jedes Kind. Kurz erklären und direkt ins Spiel kommen."];
  if (choice.age < 5) points.push("Beziehung und Struktur: einfache Rollen, wenige Regeln, Themenwelten. Spiele aktiv mit.");
  else if (choice.age < 7) points.push("Körper- und Materialerfahrung: spielerisch erkunden, Bewegungsarten variieren und klare Worte nutzen.");
  else if (choice.age < 11) points.push("Spielkreativität: Kinder entscheiden lassen, Feedback aufnehmen und das Grundspiel schrittweise erweitern.");
  else points.push("Spielfähigkeit: Verantwortung übertragen, taktische Entscheidungen und vielseitige Bewegungsreize ermöglichen.");
  points.push("Wahrnehmung → Entscheidung → Umsetzung: Aufgaben mit mehreren Lösungen statt starrer Übungsreihen.");
  if (choice.setting === "kita" && choice.children >= 13) points.push("Für diese Kita-Gruppengröße sieht ALBA ausschließlich Outdoor-Angebote vor.");
  if (choice.setting === "grundschule" && choice.children >= 13 || choice.setting === "verein") points.push("Outdoor kann eine Alternative sein. Dafür die ausgewiesenen Räume des Spiels prüfen.");
  return points;
}
export function calendarFor(choice: Choice) {
  if (choice.duration < 30) return null;
  if (choice.setting === "kita" || choice.setting === "verein" && choice.age <= 6) return { title: "Kita-Jahreskalender", href: "https://albathek.de/kalenderuebersicht/kita" };
  if (choice.setting === "verein" && choice.age >= 9) return { title: "Mini-Reihen zu Sportarten", href: "https://albathek.de/minireihen" };
  return { title: "Jahreskalender Klasse 1/2", href: "https://albathek.de/kalender/grundschule-1-bis-2" };
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
  if (/draussen|outdoor/.test(text)) c.room = "Outdoor";
  else if (/bewegungsraum|kleine halle|wenig platz/.test(text)) c.room = "Bewegungsraum";
  else if (/sporthalle|halle/.test(text)) c.room = "Sporthalle";
  if (/ohne (?:vorbereitung|aufbau)/.test(text)) c.preparation = "minimal";
  if (/ohne sportkleidung/.test(text) && c.setting !== "verein") c.sportswear = false;
  return validateChoice(c);
}
export function buildDemoPlan(prompt: string, base: Choice, excludedIds: string[] = []): Plan {
  const context = parseSituation(prompt, base);
  if (/ohne material|nur (?:\w+\s+)?balle/.test(normalize(prompt))) throw new Error("Der Offline-Planer kann Materialmengen nicht prüfen. Die ALBA-Spiele benötigen die jeweils aufgeführten Materialien. Bitte Material klären oder den KI-Modus nutzen.");
  const candidates = findGames(context).filter(x => x.eligible && !excludedIds.includes(x.game.id));
  if (!candidates.length) throw new Error("Kein ALBA-Testspiel erfüllt diese Bedingungen. Prüfe die Ausschlussgründe im Finder und passe die tatsächlichen Rahmenbedingungen an.");
  const first = candidates.find(x => /fang|lauf/i.test(x.game.category)) ?? candidates[0];
  const second = candidates.find(x => x.game.id !== first.game.id) ?? first;
  const third = candidates.find(x => x.game.intensity === "gering" && x.game.id !== first.game.id && x.game.id !== second.game.id) ?? candidates.find(x => x.game.id !== first.game.id && x.game.id !== second.game.id) ?? second;
  const times = phaseDurations(context.duration);
  return {
    headline: `${context.duration} Minuten gemeinsam in Bewegung`,
    read: `Regelbasierter Vorschlag für ${context.children} Kinder ab ${context.age} Jahren im Setting ${settings[context.setting]}. Die Zeitaufteilung ist ein Planungsvorschlag.`,
    coachNote: guidance(context)[context.age < 5 ? 1 : 2], context,
    warnings: [...new Set(candidates.slice(0,3).flatMap(x=>x.notes)), ...(candidates.length < 3 ? ["Weniger als drei passende Spiele: Ein bekanntes Grundspiel wird wiederholt. Keine ungeprüften Ersatzspiele."] : [])],
    timeline: [first,second,third].map((match,i) => ({ phase: phases[i], duration: times[i], title: match.game.title, gameId: match.game.id, reason: match.reason.join(" · "), tip: i === 2 ? "Letzte Runde bewusst abschließen. Frage: Was hat euch geholfen, was möchtet ihr beim nächsten Mal verändern?" : match.game.tip })),
  };
}

export function validatePlan(value: unknown, context: Choice, allowed: Game[]): Plan {
  const p = value as Plan;
  if (!p || !Array.isArray(p.timeline) || p.timeline.length !== 3 || ![p.headline,p.read,p.coachNote].every(x => typeof x === "string" && x.length <= 2000)) throw new Error("Die KI-Antwort ist unvollständig. Bitte erneut versuchen.");
  const durations = phaseDurations(context.duration);
  const timeline = p.timeline.map((item,i) => {
    const game = allowed.find(g=>g.id === item.gameId);
    if (!game || item.phase !== phases[i] || ![item.reason,item.tip].every(x=>typeof x === "string" && x.length <= 2000)) throw new Error("Die KI hat kein zulässiges Spiel oder keine gültige Phase geliefert.");
    return {phase: phases[i],duration:durations[i],gameId:game.id,title:game.title,reason:item.reason,tip:item.tip};
  });
  return {headline:p.headline,read:p.read,coachNote:p.coachNote,context,timeline,warnings:[...new Set(timeline.flatMap(item=>evaluateGame(allowed.find(g=>g.id===item.gameId)!,context).notes))]};
}
