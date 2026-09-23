import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaultChoice } from '../app/lib/alba.ts';
import { catalog } from '../app/lib/catalog.ts';
import { newSession, localTurn, unitAction, closingEvidence, findGames, makePlan, followingReply } from '../app/lib/coach.ts';
import { applyCoachConditions } from '../app/lib/coach-presentation.ts';
import { readSource } from '../app/lib/coach-source.ts';
import { POST } from '../app/api/coach/route.ts';

const situation='10 Kinder in der Kita, 4–5 Jahre, 20 Minuten in der Sporthalle. Zeig uns Spiele mit wenig Vorbereitung.';
test('unit action follows chat and form duration, does not impose 30 minutes',()=>{
  let s=localTurn(newSession(),situation);
  for(const duration of [15,20,45]) {
    s=applyCoachConditions(s,{...s.group.choice,duration});
    const action=unitAction(s);
    assert.equal(action.label,`${duration}-Minuten-Einheit erstellen`);
    const next=localTurn(s,action.prompt);
    assert.equal(next.plans.at(-1).timeline.reduce((n,x)=>n+x.duration,0),duration);
    assert.equal(next.group.choice.children,10);assert.equal(next.group.choice.age,4);
  }
  s=localTurn(s,'Wir haben doch nur 25 Minuten.');
  assert.match(unitAction(s).label,/25-Minuten/);
});

test('reported dead end explains chain rules and permits an explicit free unit for all personas',()=>{
  for(const profession of ['educator','novice','educatorSport','coach']) {
    let s=localTurn(newSession({...defaultChoice,profession}),situation);
    for(const prefix of ['Fliegende Pünktchen','Pilzzeit','Kastanien im Pilzwald']) {
      const game=catalog.find(g=>g.title.startsWith(prefix));
      s.selectedGameId=game.id;
      const next=localTurn(s,'Welches Folgespiel passt zum ausgewählten Spiel?');
      assert.match(next.messages.at(-1).text,/vollständige Materialliste/);
      assert.match(next.messages.at(-1).text,/20-Minuten-Einheit erstellen/);
      assert.deepEqual(next.plans,s.plans);assert.deepEqual(next.resultIds,s.resultIds);
      assert.equal(localTurn(next,unitAction(next).prompt).plans.length,1);
    }
  }
});

test('no eligible unit is not falsely promised and material constraints remain binding',()=>{
  let s=localTurn(newSession(),situation);
  s.selectedGameId=catalog.find(g=>g.title.startsWith('Pilzzeit')).id;
  s=applyCoachConditions(s,{...s.group.choice,children:100});
  const text=followingReply(s,catalog.find(g=>g.title.startsWith('Pilzzeit')));
  assert.match(text,/Aktuell verfügbar: 0/);
  assert.doesNotMatch(text,/über „.*Einheit erstellen/);
  assert.equal(localTurn(s,unitAction(s).prompt).plans.length,0);
});

test('closing preference is source-backed, soft and never relaxes exclusions',()=>{
  const s=localTurn(newSession(),situation);
  const plan=makePlan(s,unitAction(s).prompt);
  const close=catalog.find(g=>g.id===plan.timeline[2].gameId);
  assert.equal(closingEvidence(close),true);
  const excluded=catalog.filter(closingEvidence).map(g=>g.id);
  const alternative=makePlan(s,unitAction(s).prompt,excluded);
  assert.ok(alternative.timeline.every(x=>!excluded.includes(x.gameId)));
  assert.ok(alternative.warnings.some(x=>/ruhiger Charakter.*nicht belegt/.test(x)));
  const ids=findGames(s.group).filter(g=>!closingEvidence(g)).slice(0,3).map(g=>g.id);
  assert.deepEqual(makePlan(s,'Erstelle eine aktive Einheit',[],ids).timeline.map(x=>x.gameId),ids);
});

test('original preparation is provided by the source reader, including minimal as zero',async()=>{
  for(const prefix of ['Fliegende Pünktchen','Pilzzeit','Kastanien im Pilzwald']){
    const g=catalog.find(g=>g.title.startsWith(prefix));
    const source=await readSource(g.id,new AbortController().signal);
    assert.equal(source.preparationRaw,'minimal');assert.equal(source.preparationMinutes,0);
  }
});

test('AI follow-up output is canonical, offers a unit and completes with one tool round',async()=>{
  const s=localTurn(newSession(),situation), first=catalog.find(g=>g.title.startsWith('Pilzzeit'));
  s.selectedGameId=first.id;s.resultIds=[first.id];
  const original=globalThis.fetch;let calls=0;
  try {
    globalThis.fetch=async()=>{
      assert.equal(++calls,1);
      const output=[{type:'function_call',name:'next_games',call_id:'next',arguments:JSON.stringify({gameId:first.id})}];
      return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta:'Falsche Sackgasse'})+'\n\ndata: '+JSON.stringify({type:'response.completed',response:{status:'completed',output}})+'\n\n');
    };
    const res=await POST(new Request('http://localhost/api/coach',{method:'POST',body:JSON.stringify({prompt:'Welches Folgespiel passt zum ausgewählten Spiel?',state:s,apiKey:'test-only'})}));
    const events=(await res.text()).trim().split('\n').map(JSON.parse), done=events.find(e=>e.type==='done');
    assert.ok(done);assert.deepEqual(done.state.plans,s.plans);
    assert.deepEqual(done.state.resultIds,s.resultIds);
    assert.equal(events.filter(e=>e.type==='delta').map(e=>e.text).join(''),followingReply(s,first));
    assert.equal(done.state.turns.at(-1).filter(i=>i.type==='function_call_output').length,1);
  } finally {globalThis.fetch=original;}
});

test('UI has one processing indicator, dynamic unit actions and no empty-plan prerequisite',()=>{
  const ui=readFileSync(new URL('../app/components/CoachAI.tsx',import.meta.url),'utf8');
  assert.equal((ui.match(/className="coach-spinner"/g)??[]).length,1);
  assert.doesNotMatch(ui,/coach-working|KI arbeitet|Freie 30-Minuten-Einheit|Zuerst ein Spiel auswählen und eine Themenwelt/);
  assert.equal((ui.match(/send\(createUnit.prompt\)/g)??[]).length,2);
  assert.match(ui,/Abbrechen/);
});
