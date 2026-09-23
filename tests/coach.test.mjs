import assert from 'node:assert/strict';
import test from 'node:test';
import { newSession, localTurn, understand, findGames, makePlan, gameReference, restoreSession, materialConflict, planCheck } from '../app/lib/coach.ts';
import { catalog, family } from '../app/lib/catalog.ts';
import { readSource } from '../app/lib/coach-source.ts';
import { POST } from '../app/api/coach/route.ts';
const req=(state,prompt)=>new Request('http://localhost/api/coach',{method:'POST',body:JSON.stringify({state,prompt,apiKey:'test'})});
const response=(output)=>new Response('data: '+JSON.stringify({type:'response.completed',response:{status:'completed',output}})+'\n\n',{headers:{'Content-Type':'text/event-stream'}});
const call=(name,args,id='call_1')=>({type:'function_call',name,arguments:JSON.stringify(args),call_id:id});
const message=text=>({type:'message',role:'assistant',phase:'final_answer',content:[{type:'output_text',text}]});
const search={query:'Bewegung',material:null,children:10,age:null,duration:null,room:null,balls:null,interest:null};
const events=async r=>(await r.text()).trim().split('\n').map(JSON.parse);

test('conversation: Kita group -> one ball -> plan -> targeted replacement -> undo',()=>{
  let s=localTurn(newSession(),'10 Kinder, 5 Jahre, Sporthalle. Ein Ball ist vorhanden.');
  assert.equal(s.group.choice.children,10);assert.equal(s.group.balls,1);assert.equal(s.resultIds.length,6);assert.equal(s.plans.length,0);
  assert.ok(s.resultIds.every(id=>id.startsWith('kita-r')));
  s=localTurn(s,'Wir haben nur einen Ball.');assert.equal(s.group.balls,1);
  s=localTurn(s,'Mach daraus eine Einheit für 30 Minuten.');assert.equal(s.plans.length,1);
  const before=structuredClone(s.plans[0]);s=localTurn(s,'Ersetze den Einstieg durch etwas Ruhigeres.');
  assert.equal(s.plans.length,2);assert.equal(s.plans[1].timeline.reduce((sum,x)=>sum+x.duration,0),30);
  assert.notEqual(s.plans[1].timeline[0].gameId,before.timeline[0].gameId);assert.deepEqual(s.plans[1].timeline.slice(1),before.timeline.slice(1));
  s.plans.pop();assert.deepEqual(s.plans[0],before);
});
test('explanation references item 2 and never changes the plan',()=>{
  let s=localTurn(newSession(),'Eine Einheit für 30 Minuten');const before=structuredClone(s.plans);
  assert.equal(gameReference('Erklär mir Spiel 2',s).id,s.plans[0].timeline[1].gameId);
  s=localTurn(s,'Erklär mir den Aufbau von Spiel 2.');assert.deepEqual(s.plans,before);
  assert.throws(()=>makePlan(s,'Warum Spiel 2?'),/Erklärung/);
});
test('new child counts update context and trigger existing plan recheck',()=>{
  let s=localTurn(newSession(),'Eine Einheit für 30 Minuten');s=localTurn(s,'Jetzt sind es 18 Kinder');
  assert.equal(s.group.choice.children,18);assert.ok(planCheck(s).length);
  assert.deepEqual(restoreSession(JSON.stringify(s)),s);
});
test('missing material is unknown; explicit contradictions are excluded',()=>{
  const g=understand('nur einen Ball',newSession().group);
  assert.equal(materialConflict({materials:'Bälle',description:'Jedes Kind bekommt einen Ball.'},g),true);
  assert.equal(materialConflict({materials:'',description:''},g),false);
  assert.equal(findGames(understand('ohne Reifen',g)).some(x=>/reifen/i.test(x.materials)),false);
});
test('default plan deduplicates families; explicit repetition is allowed',()=>{
  const s=newSession(),ids=findGames(s.group).slice(0,3).map(g=>g.id);
  assert.throws(()=>makePlan(s,'Einheit erstellen',[],[ids[0],ids[0],ids[2]]));
  assert.equal(makePlan(s,'Einheit mit Wiederholung zur Vertiefung',[],[ids[0],ids[0],ids[2]]).timeline.length,3);
  assert.equal(new Set(makePlan(s,'Einheit erstellen').timeline.map(t=>family(catalog.find(g=>g.id===t.gameId)))).size,3);
});
test('table source never fetches external content or fills missing steps',async()=>{
  const saved=globalThis.fetch;
  try {
    globalThis.fetch=async()=>{throw Error('External source must never be fetched');};
    const g=catalog.find(g=>g.kita.steps.length);
    const source=await readSource(g.id,new AbortController().signal);
    assert.deepEqual(source.steps,g.kita.steps);assert.equal(source.sourceRow,g.kita.sourceRow);
    const missing=catalog.find(g=>!g.kita.steps.length);
    assert.equal((await readSource(missing.id,new AbortController().signal)).available,false);
    await assert.rejects(()=>readSource('https://evil.example',new AbortController().signal));
    await assert.rejects(()=>readSource('474',new AbortController().signal));
  } finally { globalThis.fetch=saved; }
});
test('API retains complete tool rounds, store:false and six authoritative results',async()=>{
  const saved=globalThis.fetch,bodies=[];
  try{
    globalThis.fetch=async(_url,options)=>{const b=JSON.parse(options.body);bodies.push(b);return bodies.length===1?response([call('search_games',search)]):response([message('Wie viele Bälle habt ihr?')]);};
    const out=await events(await POST(req(newSession(),'10 Kinder, 5 Jahre, Sporthalle. Ein Ball ist vorhanden.'))),state=out.find(e=>e.type==='done').state;
    assert.equal(state.resultIds.length,6);assert.equal(state.group.choice.children,10);assert.equal(state.turns[0].length,4);
    assert.equal(bodies.length,2);assert.ok(bodies.every(b=>b.store===false));assert.ok(bodies[1].input.some(i=>i.type==='function_call_output'));
    bodies.length=0;globalThis.fetch=async(_url,options)=>{bodies.push(JSON.parse(options.body));return response([message('Die Beschreibung erklärt den Bezug. Der Plan bleibt unverändert.')]);};
    const next=await events(await POST(req(state,'Warum passt Spiel 2?')));assert.equal(bodies.length,1);assert.ok(next.find(e=>e.type==='done'));
    assert.ok(bodies[0].input.some(i=>i.type==='function_call_output'));assert.equal(bodies[0].input.find(i=>i.phase)?.phase,'final_answer');
  }finally{globalThis.fetch=saved;}
});
test('API rejects explanation mutations and preserves the current plan on auth failures',async()=>{
  const saved=globalThis.fetch;const s=localTurn(newSession(),'Einheit für 30 Minuten'),before=structuredClone(s.plans);let count=0;
  try{
    globalThis.fetch=async()=>++count===1?response([call('propose_plan',{gameIds:s.plans[0].timeline.map(t=>t.gameId)})]):response([message('Der Plan bleibt unverändert.')]);
    const out=await events(await POST(req(s,'Warum Spiel 2?')));assert.deepEqual(out.find(e=>e.type==='done').state.plans,before);
    globalThis.fetch=async()=>new Response('',{status:401});
    const failed=await events(await POST(req(s,'Warum Spiel 2?')));assert.equal(failed.at(-1).type,'error');assert.equal(failed.at(-1).auth,true);assert.deepEqual(s.plans,before);
  }finally{globalThis.fetch=saved;}
});
test('API permits at most two tool rounds and rejects broken conversation bundles',async()=>{
  const saved=globalThis.fetch;let count=0;
  try{
    globalThis.fetch=async()=>{count++;return response([call('search_games',search,'call_'+count)]);};
    const out=await events(await POST(req(newSession(),'Fußballspiele')));assert.equal(count,3);assert.equal(out.at(-1).type,'error');
    const s=newSession();s.turns=[[call('search_games',search)]];assert.equal((await POST(req(s,'Hallo'))).status,400);
  }finally{globalThis.fetch=saved;}
});

test('API game selection -> themed story reads the spreadsheet and keeps results unchanged',async()=>{
  const saved=globalThis.fetch,bodies=[];
  let state=localTurn(newSession(),'10 Kinder, 5 Jahre, Sporthalle');
  const ids=[...state.resultIds];
  try {
    globalThis.fetch=async(_url,options)=>{bodies.push(JSON.parse(options.body));return response([message('In welcher Themenwelt möchtet ihr spielen?')]);};
    state=(await events(await POST(req(state,'Ich wähle Spiel 2.')))).find(e=>e.type==='done').state;
    assert.equal(state.selectedGameId,ids[1]);
    bodies.length=0;
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses');
      bodies.push(JSON.parse(options.body));
      return bodies.length===1?response([call('read_game',{gameId:state.selectedGameId})]):response([message('Eigene KI-Rahmung: Wir reisen durch den Wald. Der Originalablauf bleibt unverändert.')]);
    };
    const out=await events(await POST(req(state,'Erstelle eine Bewegungsgeschichte in der Themenwelt Waldtiere.')));
    const after=out.find(e=>e.type==='done').state;
    assert.deepEqual(after.resultIds,ids);assert.equal(after.plans.length,0);
    assert.equal(bodies[0].tool_choice.name,'read_game');
    assert.match(bodies[0].instructions,/Erzieher:in ohne Sportqualifikation/);
    const original=bodies[1].input.find(i=>i.type==='function_call_output'&&i.call_id==='call_1');
    assert.equal(JSON.parse(original.output).sourceRow,catalog.find(g=>g.id===ids[1]).kita.sourceRow);
  } finally {globalThis.fetch=saved;}
});

test('API material patch honors the same Kita material filter',async()=>{
  const saved=globalThis.fetch;let count=0;
  try {
    globalThis.fetch=async()=>++count===1?response([call('search_games',{...search,material:'Reifen'})]):response([message('Hier sind Spiele mit Reifen.')]);
    const out=await events(await POST(req(newSession(),'Wir möchten Reifen verwenden.')));
    const state=out.find(e=>e.type==='done').state;
    assert.equal(state.group.choice.material,'Reifen');assert.ok(state.resultIds.length);
    assert.ok(state.resultIds.every(id=>/reifen/i.test(catalog.find(g=>g.id===id).materials)));
  } finally {globalThis.fetch=saved;}
});
