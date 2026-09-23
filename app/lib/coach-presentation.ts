import { validateChoice, type Choice } from './alba.ts';
import { findGames, understand, type Session } from './coach.ts';

/** Form edits and chat share one group. This is an explicit replacement of material constraints. */
export function applyCoachConditions(state:Session, choice:Choice, excluded:string[]=[]):Session {
  const next=structuredClone(state);
  const valid=validateChoice(choice);
  if(valid.material!==state.group.choice.material || state.group.noMaterial && valid.material.trim().toLowerCase()!=='ohne material') {
    next.group.noMaterial=false;
    next.group.ballPresent=false;
    next.group.balls=null;
    next.group.excludedMaterials=[];
    next.group=understand('Material: '+valid.material,next.group);
    valid.material=next.group.noMaterial?'':valid.material;
  }
  next.group.choice=valid;
  next.turns=[];
  if(state.resultIds.length||state.messages.length) next.resultIds=findGames(next.group,'',excluded).slice(0,6).map(g=>g.id);
  if(next.selectedGameId&&!findGames(next.group,'',excluded).some(g=>g.id===next.selectedGameId)) delete next.selectedGameId;
  return next;
}

/** No HTML interpretation. Lists and paragraphs keep the model's exact text. */
export function responseBlocks(text:string):{kind:'paragraph'|'ordered'|'unordered';lines:string[];start?:number}[] {
  const blocks:ReturnType<typeof responseBlocks>=[];
  for(const line of text.split('\n')) {
    if(!line.trim()){blocks.push({kind:'paragraph',lines:[]});continue;}
    const ordered=line.match(/^\s*(\d+)[.)]\s+(.+)$/), unordered=line.match(/^\s*[-*•]\s+(.+)$/);
    const kind=ordered?'ordered':unordered?'unordered':'paragraph';
    const content=ordered?ordered[2]:unordered?unordered[1]:line;
    const previous=blocks.at(-1);
    if(previous?.kind===kind&&previous.lines.length) previous.lines.push(content);
    else blocks.push({kind,lines:[content],...(ordered?{start:Number(ordered[1])}:{})});
  }
  return blocks.filter(b=>b.lines.length);
}
