import { defaultChoice, normalize, parseSituation, validateChoice, phaseDurations, phases, type Choice, type Plan } from './alba.ts';
import { catalog, catalogMatch, catalogWarnings, family, uniqueFamilies, type CatalogGame } from './catalog.ts';

import { followsKita, kitaNotices, kitaData } from './kita.ts';

export type Group = { choice: Choice; interests: string[]; excludedMaterials: string[]; balls: number | null; ballPresent: boolean; noMaterial: boolean; wishes: string[] };
export type Message = { role: 'user' | 'assistant'; text: string; kind?: 'explanation' | 'results' | 'clarification' | 'plan'; };
export type ProviderItem = Record<string, unknown>;
export type Session = { version: 2; sourceRevision: string; selectedGameId?: string; group: Group; messages: Message[]; resultIds: string[]; plans: Plan[]; turns: ProviderItem[][]; };
export const sessionKey = 'albathek-coach-kita-dialog-v2';
export const byId = new Map(catalog.map(g => [g.id, g]));
export function newSession(choice: Choice = defaultChoice): Session {
  return { version: 2, sourceRevision: kitaData.sha256, group: { choice: validateChoice(choice), interests: [], excludedMaterials: [], balls: null, ballPresent: false, noMaterial: false, wishes: [] }, messages: [], resultIds: [], plans: [], turns: [] };
}
export function restoreSession(raw: string): Session {
  const s = JSON.parse(raw) as Session;
  if (s.sourceRevision !== kitaData.sha256) throw Error('Die Sitzung gehört zu einem anderen Datenstand. Bitte ein neues Gespräch starten.');
  if (s.version !== 2 || !Array.isArray(s.messages) || !s.messages.every(m => ['user','assistant'].includes(m.role) && typeof m.text === 'string') || !Array.isArray(s.turns) || !Array.isArray(s.plans)) throw Error('Ungültige Sitzung');
  s.group.choice = validateChoice(s.group.choice);
  for (const field of ['interests','excludedMaterials','wishes'] as const) if (!Array.isArray(s.group[field]) || !s.group[field].every(x => typeof x === 'string')) throw Error('Ungültige Gruppe');
  if (!(s.group.balls === null || Number.isInteger(s.group.balls) && s.group.balls >= 0 && s.group.balls <= 100)) throw Error('Ungültige Ballanzahl');
  if (!Array.isArray(s.resultIds) || s.resultIds.some(id => !byId.has(id))) throw Error('Ungültige Treffer');
  if (s.plans.some(p => !p.timeline || p.timeline.length !== 3 || p.timeline.some(t => !byId.has(t.gameId) || !Number.isInteger(t.duration) || t.duration < 1))) throw Error('Ungültiger Plan');
  if (s.selectedGameId && !byId.has(s.selectedGameId)) throw Error('Ungültige Spielauswahl');
  return s;
}
export function understand(text: string, previous: Group): Group {
  const g = structuredClone(previous), t = normalize(text);
  g.choice = parseSituation(text, g.choice);
  // The explicit profile owns the persona; mentioning Kita must not silently change it.
  const materialWish = t.match(/(?:spiele?\s+mit\s+|material\s*:\s*|mochten\s+)(reifen|balle|ball|hutchen|seile?|matten|banke|luftballons|papprollen)\b/);
  if (materialWish) {
    g.choice.material = ({balle:'Ball',hutchen:'Hütchen',banke:'Bänke'} as Record<string,string>)[materialWish[1]] ?? materialWish[1][0].toUpperCase()+materialWish[1].slice(1);
    g.noMaterial = false;
    const normalizedMaterial = normalize(g.choice.material);
    g.excludedMaterials = g.excludedMaterials.filter(x => !normalizedMaterial.includes(x));
  }
  if (/fussball/.test(t) && !g.interests.includes('Fußball')) g.interests.push('Fußball');
  if (/basketball/.test(t) && !g.interests.includes('Basketball')) g.interests.push('Basketball');
  if (/ruhig|ruhiger|schwierig|einfach/.test(t)) g.wishes = [...g.wishes.slice(-7), text.slice(0,200)];
  const ball = t.match(/\b(\d+|ein(?:en)?|zwei|drei)\s+ball(?:e|en)?\b/);
  if (ball) { g.balls = ({ ein:1,einen:1,zwei:2,drei:3 } as Record<string,number>)[ball[1]] ?? Number(ball[1]); g.ballPresent = true; g.noMaterial = false; g.excludedMaterials = g.excludedMaterials.filter(x => x !== 'ball'); if (/ohne|kein/.test(normalize(g.choice.material))) g.choice.material = ''; }
  else if (/\bball\b/.test(t) && !/kein(?:en)? ball|ohne ball/.test(t)) { g.ballPresent = true; g.noMaterial = false; }
  if (/ohne material|kein material/.test(t)) { g.noMaterial = true; g.ballPresent = false; g.balls = 0; g.choice.material = ''; }
  for (const material of ['ball','reifen','hütchen','seil','matte','bank']) {
    if (new RegExp(`(?:ohne|kein(?:e|en)?)\\s+${normalize(material)}`).test(t)) g.excludedMaterials = [...new Set([...g.excludedMaterials, normalize(material)])];
  }
  if (g.excludedMaterials.includes('ball')) { g.balls = 0; g.ballPresent = false; }
  return g;
}
export function materialConflict(game: CatalogGame, group: Group) {
  const m = normalize(game.materials ?? ''), d = normalize((game.description ?? '') + ' ' + (game.kita?.steps.join(' ') ?? ''));
  if (group.noMaterial && !/^(ohne|kein(?:e)?) material\.?$/.test(m)) return true;
  if (group.excludedMaterials.some(x => m.includes(x))) return true;
  // Missing quantities remain unknown. Reject only documented contradictions.
  if (group.balls === 1 && /ball/.test(m) && /(?:jedes kind|alle kinder|pro kind|jedes paar|beide).{0,55}(?:einen|ein|ihre[n]?) (?:hand|fuss|basket|tennis)?ball|ihre balle|mit ballen|mehrere balle|zwei balle|drei balle|\b[2-9] balle/.test(m + ' ' + d)) return true;
  return false;
}
export function findGames(group: Group, query = '', excluded: string[] = []) {
  const terms = normalize([query, ...group.interests].join(' ')).replace(/fussballer\w*/g,'fussball').split(/[^a-z]+/).filter(t => t.length > 3 && !['kinder','meist','minuten','haben','einen','spiel','spiele','sporthalle'].includes(t));
  const ranked = catalog.map(game => {
    const match = catalogMatch(game, group.choice);
    const t = normalize(game.title + ' ' + (game.description ?? ''));
    return { game, eligible: match.eligible && !excluded.includes(game.id) && !materialConflict(game,group), score: match.score + terms.filter(x => t.includes(x)).length * 20 + terms.filter(x=>normalize(game.title).includes(x)).length * 10 + (group.balls===1&&/ein(?:en)? (?:fuss|hand|basket)?ball/.test(normalize(game.materials??''))?15:0) + (group.ballPresent && /ball/.test(game.materials ?? '') ? 3 : 0) + (/ruhig|einfach/.test(normalize(query)) && /wahrnehm|gleichgewicht|geschick|kooper/.test(t) ? 35 : 0) };
  }).filter(m => m.eligible).sort((a,b) => b.score-a.score);
  return uniqueFamilies(ranked.map(m => m.game));
}
export function actionFor(text: string, state?: Session): { kind: 'explanation' | 'results' | 'plan'; slot: number | null } {
  const t = normalize(text);
  // Questions and negations must not create a plan just because they name one.
  if (/^(?:bitte\s+)?(?:warum|wieso|weshalb|erklar(?:e)?|erlautere|wie funktioniert|wie geht|wie ist|wie kann|wie viele?|was bedeutet|was ist)\b/.test(t) || /\b(?:einheit|sportstunde|trainingsplan)\b.*\b(?:erklaren|erlautern)\b/.test(t)) return {kind:'explanation',slot:null};
  if (/\b(?:keine[nr]?|ohne)\s+(?:neue[nr]?\s+|ganze[nr]?\s+)?(?:einheit|sportstunde|bewegungsstunde|trainingsstunde|trainingsplan|plan)\b/.test(t)) return {kind:'results',slot:null};
  const numbered = t.match(/spiel\s*([123])/);
  const slot = numbered ? Number(numbered[1])-1 : /einstieg|ankommen/.test(t) ? 0 : /hauptteil|action/.test(t) ? 1 : /abschluss|landen/.test(t) ? 2 : null;
  const change = /ersetz|tausch/.test(t) || !!state?.plans.length && /andere[srn]? spiel|ruhiger|zu schwierig/.test(t);
  // An explicit plan request wins over an additional theme/story wish.
  if (change || /\b(?:einheit|trainingsplan|sportstunde|bewegungsstunde|trainingsstunde|stundenplan)\b|plan erstellen|plan bauen|wiederhol|vertief/.test(t)) return {kind:'plan',slot:change?slot:null};
  if (state?.selectedGameId && /themenwelt/i.test(state.messages.at(-1)?.text ?? '') && t.split(/\s+/).length <= 5 && !/\d|kinder|ball|material|spiel|einheit|plan|warum|erklar|sporthalle|raum|draussen|andere/.test(t)) return {kind:'explanation',slot:null};
  if (/ich wahle spiel|themenwelt|bewegungsgeschichte|geschichte|folgespiel|nachstes spiel/.test(t)) return { kind:'explanation',slot:null };
  return {kind:/\baufbau\b/.test(t)?'explanation':'results',slot:null};
}
export function planAvailabilityMessage(state:Session, excluded:string[]=[]):string {
  const group=state.group, count=findGames(group,'',excluded).length;
  const notices=kitaNotices(group.choice);
  if(notices.length) return 'Noch keine Einheit: '+notices.join(' ')+' Welche der genannten Rahmenbedingungen treffen für euer Angebot tatsächlich zu?';
  const reasons=new Map<string,number>();
  for(const game of catalog) {
    if(excluded.includes(game.id)) continue;
    for(const reason of catalogMatch(game,group.choice).excluded) reasons.set(reason,(reasons.get(reason)??0)+1);
    if(materialConflict(game,group)) {
      const reason='Dokumentierte Materialanforderungen widersprechen euren Angaben.';
      reasons.set(reason,(reasons.get(reason)??0)+1);
    }
  }
  const common=[...reasons].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([reason,n])=>reason+' ('+n+' Einträge)');
  return 'Für eine freie Einheit benötige ich drei geeignete, unterschiedliche Spielfamilien. Aktuell verfügbar: '+count+'.'+
    (common.length?' Häufige Ausschlussgründe in der Tabelle: '+common.join(' '):'')+
    (excluded.length?' '+excluded.length+' Einträge sind für heute ausgeblendet.':'')+
    ' Möchtest du zunächst die verfügbaren Einzelspiele ansehen oder eine tatsächlich abweichende Gruppenangabe korrigieren?';
}
export function planConfirmation(state:Session,text:string,local=false):string {
  const plan=state.plans.at(-1)!;
  const action=actionFor(text,state);
  const summary=action.slot===null
    ? 'Deine '+(local?'regelbasiert erstellte ':'')+'freie Einheit für '+plan.timeline.reduce((n,t)=>n+t.duration,0)+' Minuten ist bereit.'
    : ['Einstieg','Hauptteil','Abschluss'][action.slot]+' ersetzt; die übrigen Abschnitte und Zeiten bleiben unverändert.';
  return summary+'\n'+plan.timeline.map((t,i)=>(i+1)+'. '+t.phase+': '+t.title+' ('+t.duration+' Min.)').join('\n')+
    '\nDie Einheit ist ein eigener Planungsvorschlag, keine freigegebene ALBA-Einheitensystematik. Materialmengen und Originalanleitungen bitte vor der Durchführung prüfen.'+
    (/themenwelt|geschichte/.test(normalize(text))?'\nDer Plan ist erstellt. Eine thematische Geschichte ist damit noch nicht ausgearbeitet; dafür bitte ein Spiel auswählen und die Themenwelt im nächsten Schritt vertiefen.':'');
}
export function gameReference(text: string, state: Session) {
  const t = normalize(text), n = t.match(/spiel\s*([1-6])/);
  const latestSelection = [...state.messages].reverse().find(m=>m.role==='assistant'&&(m.kind==='results'||m.kind==='plan'));
  const fromResults = /ich wahle spiel|treffer|sammlung|suchergebnis|spielideen/.test(t)
    || !/einheit|plan|hauptteil|einstieg|abschluss/.test(t) && latestSelection?.kind==='results';
  const ids = fromResults ? state.resultIds : state.plans.at(-1)?.timeline.map(t => t.gameId) ?? state.resultIds;
  return byId.get(n ? ids[Number(n[1])-1] : state.selectedGameId ?? ids[0]);
}
export function makePlan(state: Session, text: string, excluded: string[] = [], selected?: string[]): Plan {
  const action = actionFor(text,state), old = state.plans.at(-1);
  if (action.kind !== 'plan') throw Error('Eine Erklärung darf den Plan nicht verändern.');
  const candidates = findGames(state.group, text, excluded);
  const repeat = /wiederhol|vertief/.test(normalize(text));
  let games: CatalogGame[];
  if (old && action.slot !== null) {
    const keep = old.timeline.filter((_,i) => i !== action.slot).map(t => byId.get(t.gameId)!);
    const replacement = (selected ? selected.map(id => byId.get(id)) : candidates).find(g => g && g.id !== old.timeline[action.slot!].gameId && (repeat || !keep.some(k => family(k) === family(g))));
    if (!replacement) throw Error('Keine andere geeignete Spielfamilie für diesen Abschnitt gefunden. Der bisherige Plan bleibt erhalten. Möchtest du die vorhandenen Einzelspiele prüfen?');
    games = old.timeline.map((t,i) => i === action.slot ? replacement : byId.get(t.gameId)!);
  } else games = selected ? selected.map(id => byId.get(id)!) : candidates.slice(0,3);
  const selectedInvalid=selected?.some(id=>!candidates.some(c=>c.id===id))??false;
  const gameInvalid=games.some(g=>!g||excluded.includes(g.id)||!catalogMatch(g,state.group.choice).eligible||materialConflict(g,state.group));
  if (games.length !== 3 || selectedInvalid || gameInvalid || !repeat && uniqueFamilies(games).length !== 3) {
    if(candidates.length<3) throw Error(planAvailabilityMessage(state,excluded));
    const invalidTitles=games.filter(g=>g&&!candidates.some(c=>c.id===g.id)).map(g=>g.title);
    throw Error(invalidTitles.length?'Diese Spiele passen nicht zu den aktuellen Bedingungen: '+invalidTitles.join(', ')+'. Der bisherige Plan bleibt erhalten. Soll die ganze Einheit an die neuen Angaben angepasst werden?':'Die Spielauswahl ist ungültig oder enthält nicht erlaubte Wiederholungen. Bitte drei geeignete unterschiedliche Spiele wählen.');
  }
  const times = old && action.slot !== null ? old.timeline.map(t => t.duration) : phaseDurations(state.group.choice.duration);
  return { headline: `${times.reduce((a,b)=>a+b,0)} Minuten gemeinsam in Bewegung`, read:'Die Reihenfolge und Zeitaufteilung sind Planungsvorschläge, keine ALBA-Originalvorgaben.', coachNote:repeat ? 'Wiederholung zur Vertiefung ausdrücklich gewünscht.' : 'Kurze Erklärungen, viel aktive Zeit und gemeinsame Reflexion.', context: { ...state.group.choice, duration: times.reduce((a,b)=>a+b,0) }, warnings: catalogWarnings(state.group.choice), timeline:games.map((g,i) => old && action.slot !== null && i !== action.slot ? old.timeline[i] : { phase:phases[i],duration:times[i],title:g.title,gameId:g.id,reason:g.description ?? g.audience,tip:'Eigener Coaching-Vorschlag: kurz vormachen, beobachten und die Kinder an Anpassungen beteiligen.' }) };
}
export function planCheck(state: Session) {
  const plan = state.plans.at(-1);
  if (!plan) return [];
  const invalid = plan.timeline.filter(t => { const g = byId.get(t.gameId)!; return !catalogMatch(g,{...state.group.choice,material:state.group.choice.material}).eligible || materialConflict(g,state.group); });
  const total = plan.timeline.reduce((sum, item) => sum + item.duration, 0);
  return [...(invalid.length ? ['Der bestehende Plan muss an die neuen Bedingungen angepasst werden: '+invalid.map(t=>t.title).join(', ')] : []), ...(total !== state.group.choice.duration ? [`Die bestehende Einheit dauert ${total} Minuten; aktuell sind ${state.group.choice.duration} Minuten vorgesehen. Bitte die Einheit ausdrücklich an die neue Zeit anpassen lassen.`] : []), ...(plan.context.children !== state.group.choice.children || plan.context.age !== state.group.choice.age ? ['Gruppendaten wurden geändert. Bitte die Eignung der bestehenden Einheit erneut anhand der Originalanleitungen prüfen.'] : [])];
}
export function localTurn(state: Session, text: string, excluded: string[] = []): Session {
  const next = structuredClone(state); next.group = understand(text,next.group);
  const action = actionFor(text, state);
  if (/ich wahle spiel/i.test(normalize(text))) next.selectedGameId = gameReference(text,next)?.id;
  let reply: string, kind:Message['kind']=action.kind;
  if (action.kind === 'explanation') {
    const game = gameReference(text,next);
    if (/folgespiel|nachstes spiel/.test(normalize(text))) {
      const following = game ? findGames(next.group,'',excluded).filter(g=>followsKita(game.kita!,g.kita!)) : [];
      reply = following.length ? 'Passende Folgespiele nach der eindeutigen Material-/Kategorienregel: ' + following.slice(0,3).map(g=>g.title).join('; ') : 'Kein verlässlich passendes Folgespiel nach den eindeutigen Tabellenregeln gefunden. Unklare Spaltenregeln werden nicht angewendet.';
    } else if (/ich wahle spiel/.test(normalize(text))) {
      reply = game ? game.title + ' ist ausgewählt. In welcher Themenwelt möchtet ihr spielen? Ohne API-Key kann ich den Tabellen-Ablauf zeigen, aber keine KI-Bewegungsgeschichte erstellen.' : 'Bitte zuerst ein angezeigtes Spiel auswählen.';
    } else {
      reply = game ? game.title + '\nOriginal aus der KITA-Tabelle:\n' + (game.kita!.steps.join('\n') || 'Der Ablauf fehlt in der Tabelle.') + '\nMaterial: ' + (game.materials || 'Nicht angegeben.') + '\nOhne API-Key: keine KI-Beratung oder erzeugte Bewegungsgeschichte.' : 'Wähle zunächst ein Spiel aus der Sammlung aus.';
    }
  } else {
    next.resultIds = findGames(next.group,text,excluded).slice(0,6).map(g=>g.id);
    if (action.kind === 'plan') {
      try { next.plans.push(makePlan(next,text,excluded)); reply=planConfirmation(next,text,true); }
      catch (error) { reply = (error as Error).message; kind='clarification'; }
    } else reply = `${next.resultIds.length} Spielideen aus der KITA-Content-Tabelle. ${kitaNotices(next.group.choice).join(' ')} ${next.group.balls === 1 ? 'Ein Ball ist übernommen. Bekannte Mengenwidersprüche wurden ausgeschlossen; nicht dokumentierte Mengen bitte im Original prüfen.' : next.group.ballPresent && next.group.balls === null ? 'Ball ist vorhanden. Wie viele Bälle habt ihr?' : 'Wähle ein Spiel aus. Danach kannst du eine Themenwelt angeben.'} Ohne API-Key: regelbasierte Suche, kein KI-Dialog.`;
  }
  next.messages.push({role:'user',text},{role:'assistant',text:reply,kind});
  return next;
}
