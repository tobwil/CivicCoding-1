import test from 'node:test';
import assert from 'node:assert/strict';
import { actionFor, newSession, localTurn, findGames, restoreSession } from '../app/lib/coach.ts';
import { POST } from '../app/api/coach/route.ts';

const search={query:'Bewegung',children:null,age:null,duration:null,room:null,material:null,balls:null,interest:null};
const call=(name,args,id)=>({type:'function_call',name,arguments:JSON.stringify(args),call_id:id});
const message=text=>({type:'message',role:'assistant',content:[{type:'output_text',text}]});
async function simulated(prompt,state,outputs) {
  const original=globalThis.fetch,bodies=[];
  try{
    globalThis.fetch=async(_url,options)=>{
      bodies.push(JSON.parse(options.body));
      const output=outputs[bodies.length-1];assert.ok(output,'Unexpected extra model request');
      return new Response('data: '+JSON.stringify({type:'response.completed',response:{status:'completed',output}})+'\n\n');
    };
    const response=await POST(new Request('http://localhost/api/coach',{method:'POST',body:JSON.stringify({prompt,state,apiKey:'controlled-test'})}));
    const events=(await response.text()).trim().split('\n').map(JSON.parse);
    const done=events.find(e=>e.type==='done');
    assert.ok(done,JSON.stringify(events));
    return {state:done.state,events,bodies};
  }finally{globalThis.fetch=original;}
}

test('explicit sport lesson and thematic plan requests create units locally',()=>{
  for(const prompt of ['Plane eine Sportstunde für 30 Minuten.','Erstelle eine Einheit für 30 Minuten in der Themenwelt Waldtiere.','Bitte eine Bewegungsstunde für 30 Minuten.']){
    assert.equal(actionFor(prompt).kind,'plan');
    const next=localTurn(newSession(),prompt);
    assert.equal(next.plans.length,1);
    assert.equal(next.plans[0].timeline.reduce((n,t)=>n+t.duration,0),30);
  }
});
test('duration, explanation, negation and story alone never trigger a plan',()=>{
  for(const prompt of ['10 Kinder, 5 Jahre, 30 Minuten in der Sporthalle.','Warum passt diese Einheit?','Erkläre den Aufbau der Einheit.','Wie viele Reifen brauchen wir für Spiel 2?','Kannst du die Sportstunde erklären?','Bitte keine Einheit, nur einzelne Spiele.','Wir suchen ruhige Spiele.','Erstelle eine Bewegungsgeschichte in der Themenwelt Waldtiere.']){
    assert.notEqual(actionFor(prompt).kind,'plan',prompt);
    assert.equal(localTurn(newSession(),prompt).plans.length,0,prompt);
  }
});
test('ineligible local plan reports concrete room rule, keeps old plan and marks clarification',()=>{
  const before=localTurn(newSession(),'Einheit für 30 Minuten');
  const next=localTurn(before,'Plane eine Sportstunde für 18 Kinder im Bewegungsraum.');
  assert.deepEqual(next.plans,before.plans);
  assert.equal(next.messages.at(-1).kind,'clarification');
  assert.match(next.messages.at(-1).text,/Mehr als 12 Kinder/);
});
test('too few families explains candidate count and actual exclusion reasons',()=>{
  const next=localTurn({...newSession(),group:{...newSession().group,choice:{...newSession().group.choice,material:'unbekanntes Gerät'}}},'Plane eine Sportstunde');
  assert.equal(next.plans.length,0);
  assert.match(next.messages.at(-1).text,/Aktuell verfügbar: 0/);
  assert.match(next.messages.at(-1).text,/Gewünschtes Material nicht ausgewiesen/);
});
test('API forces proposal after search and returns only a verified confirmation',async()=>{
  const s=newSession(), ids=findGames(s.group).slice(0,3).map(g=>g.id);
  const out=await simulated('Plane eine Sportstunde für 30 Minuten.',s,[
    [call('search_games',search,'s')],
    [call('propose_plan',{gameIds:ids},'p')],
  ]);
  assert.deepEqual(out.bodies.map(b=>b.tool_choice),[{type:'function',name:'search_games'},{type:'function',name:'propose_plan'}]);
  assert.equal(out.state.plans.length,1);
  assert.equal(out.state.messages.at(-1).kind,'plan');
  assert.match(out.state.messages.at(-1).text,/freie Einheit für 30 Minuten ist bereit/);
  assert.doesNotMatch(out.events.filter(e=>e.type==='delta').map(e=>e.text).join(''),/Einzelspiel/);
  assert.deepEqual(restoreSession(JSON.stringify(out.state)),out.state);
  assert.equal(out.state.turns[0].filter(i=>i.type==='function_call').length,2);
  assert.equal(out.state.turns[0].filter(i=>i.type==='function_call_output').length,2);
});
test('API search-only model completion now gets a separately validated local plan',async()=>{
  const out=await simulated('Erstelle eine Einheit für 30 Minuten in der Themenwelt Waldtiere.',newSession(),[
    [call('search_games',search,'s')],[message('Hier sind einzelne Spiele.')],
  ]);
  assert.equal(out.state.plans.length,1);
  assert.match(out.state.messages.at(-1).text,/regelbasiert erstellt/);
  assert.match(out.state.messages.at(-1).text,/Geschichte ist damit noch nicht ausgearbeitet/);
  assert.equal(out.bodies.length,2);
});
test('API incomplete search cannot silently create a plan using guessed conditions',async()=>{
  const out=await simulated('Plane eine Sportstunde.',newSession(),[[message('Fertig.')]]);
  assert.equal(out.state.plans.length,0);
  assert.equal(out.state.messages.at(-1).kind,'clarification');
  assert.match(out.state.messages.at(-1).text,/nicht vollständig geprüft/);
});
test('API impossible request keeps history and gives specific clarification, not a false plan',async()=>{
  const before=localTurn(newSession(),'Einheit erstellen');
  const out=await simulated('Plane eine Sportstunde für 18 Kinder im Bewegungsraum.',before,[
    [call('search_games',search,'s')],[message('Deine Einheit ist fertig.')],
  ]);
  assert.deepEqual(out.state.plans,before.plans);
  assert.equal(out.state.messages.at(-1).kind,'clarification');
  assert.match(out.state.messages.at(-1).text,/Mehr als 12 Kinder/);
  assert.doesNotMatch(out.state.messages.at(-1).text,/ist fertig/);
});
test('targeted replacement fallback preserves other sections and total duration',async()=>{
  const before=localTurn(newSession(),'Einheit für 30 Minuten');
  const out=await simulated('Ersetze den Einstieg durch etwas Ruhigeres.',before,[
    [call('search_games',search,'s')],[message('Hier sind Spiele.')],
  ]);
  const old=before.plans[0].timeline,next=out.state.plans.at(-1).timeline;
  assert.equal(out.state.plans.length,2);
  assert.notEqual(next[0].gameId,old[0].gameId);
  assert.deepEqual(next.slice(1),old.slice(1));
  assert.deepEqual(next.map(t=>t.duration),old.map(t=>t.duration));
});
test('a search request rejects unsolicited plan tool calls',async()=>{
  const s=newSession(),ids=findGames(s.group).slice(0,3).map(g=>g.id);
  const out=await simulated('10 Kinder, 30 Minuten, Sporthalle.',s,[
    [call('search_games',search,'s')],[call('propose_plan',{gameIds:ids},'p')],[message('Hier sind Spielideen.')],
  ]);
  assert.equal(out.state.plans.length,0);
  const output=out.state.turns[0].find(i=>i.type==='function_call_output'&&i.call_id==='p');
  assert.match(JSON.parse(output.output).error,/Ohne ausdrücklichen Planauftrag/);
});
