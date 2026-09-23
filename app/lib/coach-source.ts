import { byId } from './coach.ts';

// The attachment is authoritative for this evaluation. No live HTML enrichment:
// otherwise missing spreadsheet fields would be hidden by external knowledge.
export type Source = { title: string; href: string; available: boolean; description: string; materials: string; steps: string[]; note: string; sourceRow: number };
export async function readSource(id: string, signal: AbortSignal): Promise<Source> {
  if (signal.aborted) throw Error('Abgebrochen');
  const game = byId.get(id);
  if (!game?.kita) throw Error('Spiel nicht im freigegebenen KITA-Katalog');
  const source = game.kita;
  return {
    title: game.title, href: game.href, available: source.steps.length > 0,
    description: source.description, materials: source.materials, steps: source.steps,
    sourceRow: source.sourceRow,
    note: 'Originaldaten: Content-Tabelle_Kita.xlsx, Spiele Kita, Zeile ' + source.sourceRow +
      '. Fehlende Angaben nicht ergänzen. Geschichten als eigene KI-Rahmung kennzeichnen; Regeln, Material und Ablauf beibehalten. ' + source.issues.join(' '),
  };
}
