import assert from 'node:assert/strict';
import test from 'node:test';
import { kitaColumnAssumptions, kitaData, evaluateKita, followsKita } from '../app/lib/kita.ts';
import { defaultChoice } from '../app/lib/alba.ts';
import { catalog } from '../app/lib/catalog.ts';
import { newSession, findFollowingGames, localTurn } from '../app/lib/coach.ts';
import { POST } from '../app/api/coach/route.ts';
const game = (id,categories,level='Einsteiger',materials='Reifen') => ({...kitaData.records[0],id,family:id,categories,level,materials,preparationMinutes:0,minAge:3,maxAge:6,minChildren:3,maxChildren:28});

test('explicit mapping covers the coherent shifted fields, not AP/AR',()=>{
  assert.deepEqual(Object.values(kitaColumnAssumptions).map(x=>x.column),['I','V','W','X','Z','AA','AC','AD','AE']);
  assert.equal(kitaColumnAssumptions.AF.field,'Fangspiel');
  assert.equal(kitaColumnAssumptions.AN.field,'Materialgewöhnung');
  assert.equal(kitaColumnAssumptions.AP,undefined);assert.equal(kitaColumnAssumptions.AR,undefined);
});
test('reconstructed educator and coach chains respect persona and category change',()=>{
  const a=game('a',['Fangspiel']), b=game('b',['Zielwurfspiel']);
  for(const role of ['educatorSport','coach']) assert.equal(followsKita(a,b,role),true);
  for(const role of ['educator','novice','invalid']) assert.equal(followsKita(a,b,role),false);
  assert.equal(followsKita(a,game('b',['Fangspiel','Zielwurfspiel']),'coach'),false);
  assert.equal(followsKita(a,game('b',['Laufschule']),'educatorSport'),true);
  assert.equal(followsKita(a,game('b',['Laufschule']),'coach'),false);
  assert.equal(followsKita(a,{...b,family:'a'},'coach'),false);
});
test('qualified educator advanced game must be followed by an easy running or bridging game',()=>{
  const first=game('a',['Zielwurfspiel'],'Fortgeschrittene');
  for(const cat of ['Laufspiel','Laufschule','Überbrückungsspiel']) assert.equal(followsKita(first,game('b',[cat]),'educatorSport'),true);
  assert.equal(followsKita(first,game('b',['Fangspiel']),'educatorSport'),false);
  assert.equal(followsKita(first,game('b',['Überbrückungsspiel'],'Fortgeschrittene'),'educatorSport'),false);
  assert.equal(followsKita(game('a',['Fangspiel']),game('b',['Zielwurfspiel'],'Fortgeschrittene'),'educatorSport'),false);
  assert.equal(followsKita(game('a',['Fangspiel'],'Experte'),game('b',['Zielwurfspiel'],'Experte'),'coach'),true);
});
test('unknown material and additional devices never satisfy material equality',()=>{
  const a=game('a',['Fangspiel']),b=game('b',['Zielwurfspiel']);
  assert.equal(followsKita(a,{...b,materials:'Reifen, Tamburin'},'coach'),false);
  assert.equal(followsKita({...a,materials:''},{...b,materials:''},'coach'),false);
  assert.equal(followsKita({...a,materials:'ohne Material'},{...b,materials:'kein Material'},'coach'),true);
  assert.equal(followsKita({...a,materials:'Seile; Reifen'},{...b,materials:'reifen, seile'},'coach'),true);
});
test('coach category selection uses age and time with documented fractional-age assumption',()=>{
  const c={...defaultChoice,profession:'coach',duration:20};
  const ball=game('a',['Ballspiele']),strength=game('b',['Kraft- und Gewandheitsspiele']);
  for(const age of [3,3.5,4,4.5]) {assert.equal(evaluateKita(ball,{...c,age}).eligible,true);assert.equal(evaluateKita(strength,{...c,age}).eligible,false);}
  assert.equal(evaluateKita(ball,{...c,age:5,duration:29}).eligible,false);
  assert.equal(evaluateKita(strength,{...c,age:5,duration:29}).eligible,true);
  for(const duration of [30,31]) assert.equal(evaluateKita(ball,{...c,age:5,duration}).eligible,true);
  assert.equal(evaluateKita(ball,{...c,profession:'educator',age:5}).eligible,true);
});
test('real catalog chains work locally and reject stale or excluded first games',()=>{
  const c={...defaultChoice,profession:'educatorSport',duration:30};
  const state=newSession(c),first=catalog.find(g=>g.title==='Stopp: Laufen und Anhalten für Fortgeschrittene');
  assert.ok(first);
  const following=findFollowingGames(state.group,first);assert.ok(following.length);
  assert.ok(following.every(g=>g.kita.level==='Einsteiger'));
  assert.deepEqual(findFollowingGames(state.group,first,[first.id]),[]);
  assert.deepEqual(findFollowingGames({...state.group,choice:{...c,children:100}},first),[]);
  assert.deepEqual(findFollowingGames({...state.group,choice:{...c,profession:'educator'}},first),[]);
  state.selectedGameId=first.id;state.resultIds=[first.id];
  const after=localTurn(state,'Welches Folgespiel passt?');
  assert.ok(after.messages.at(-1).text.includes(following[0].title));
  assert.deepEqual(after.plans,state.plans);assert.deepEqual(after.resultIds,state.resultIds);
});
test('next_games API uses the same reconstructed rules and labels the assumption',async()=>{
  const state=newSession({...defaultChoice,profession:'educatorSport',duration:30});
  const first=catalog.find(g=>g.title==='Stopp: Laufen und Anhalten für Fortgeschrittene');
  state.resultIds=[first.id];state.selectedGameId=first.id;
  const saved=globalThis.fetch;let count=0;
  try {
    globalThis.fetch=async()=>{
      const output=++count===1?[{type:'function_call',name:'next_games',call_id:'next',arguments:JSON.stringify({gameId:first.id})}]:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Hier ist ein geprüftes Folgespiel.'}]}];
      return new Response('data: '+JSON.stringify({type:'response.completed',response:{status:'completed',output}})+'\n\n');
    };
    const res=await POST(new Request('http://localhost/api/coach',{method:'POST',body:JSON.stringify({apiKey:'test',state,prompt:'Welches Folgespiel passt?'})}));
    const events=(await res.text()).trim().split('\n').map(JSON.parse),done=events.find(x=>x.type==='done');assert.ok(done);
    const output=JSON.parse(done.state.turns.at(-1).find(x=>x.type==='function_call_output').output);
    assert.deepEqual(output.games.map(g=>g.id),findFollowingGames(state.group,first).slice(0,3).map(g=>g.id));
    assert.match(output.note,/dokumentierte Annahmen/);assert.match(output.note,/AP\/AR/);
    assert.deepEqual(done.state.plans,state.plans);
  } finally {globalThis.fetch=saved;}
});
