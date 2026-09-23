import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { catalog, searchCatalog, catalogMatch } from '../app/lib/catalog.ts';
import { defaultChoice, validateChoice, professionOptions } from '../app/lib/alba.ts';
import { kitaData, kitaPersonas, evaluateKita, followsKita } from '../app/lib/kita.ts';
import { newSession, localTurn, findGames, makePlan, restoreSession, understand, gameReference } from '../app/lib/coach.ts';
import { POST } from '../app/api/coach/route.ts';
const choice = overrides => ({...defaultChoice,...overrides});
const source = { ...kitaData.records.find(g=>g.sourceRow===7), outdoors:true, categories:['Fangspiel'], minAge:3, maxAge:6, minChildren:3, maxChildren:28, level:'Einsteiger', preparationMinutes:0 };

test('catalog is exactly the 129 workbook records with traceable row IDs',()=>{
  assert.equal(catalog.length,129);assert.equal(new Set(catalog.map(g=>g.id)).size,129);
  assert.deepEqual(catalog.map(g=>g.id),kitaData.records.map(g=>'kita-r'+g.sourceRow));
  assert.equal(kitaData.source,'Content-Tabelle_Kita.xlsx');assert.match(kitaData.sha256,/^[a-f0-9]{64}$/);
  assert.equal(searchCatalog(defaultChoice).length,129);
  assert.ok(catalog.every(g=>g.kita && !g.profile));
  assert.equal(catalog.filter(g=>g.href).length,74);
  const publicData=JSON.parse(readFileSync(new URL('../app/data/public-games.json',import.meta.url),'utf8'));
  assert.ok(catalog.filter(g=>g.href).every(g=>publicData.some(p=>p.href===g.href&&p.image===g.image)));
});
test('only four completed Kita personas, no generic/school/club options',()=>{
  assert.equal(Object.keys(kitaPersonas).length,4);
  assert.deepEqual(professionOptions('kita'),['educator','novice','educatorSport','coach']);
  for(const profession of ['teacher','sportTeacher','other']) assert.throws(()=>validateChoice(choice({profession})));
  for(const setting of ['grundschule','verein']) assert.throws(()=>validateChoice(choice({setting})));
});
test('beginner roles use the same strict preparation and level rules',()=>{
  for(const profession of ['educator','novice']) {
    assert.equal(evaluateKita(source,choice({profession})).eligible,true);
    assert.equal(evaluateKita({...source,level:'Fortgeschrittene'},choice({profession})).eligible,false);
    assert.equal(evaluateKita({...source,preparationMinutes:5},choice({profession})).eligible,false);
  }
  assert.deepEqual(searchCatalog(choice({profession:'educator'})).filter(m=>m.eligible).map(m=>m.game.id),searchCatalog(choice({profession:'novice'})).filter(m=>m.eligible).map(m=>m.game.id));
});
test('qualified educators and experienced coaches have distinct allowed levels',()=>{
  for(const profession of ['educatorSport','coach']) {
    assert.equal(evaluateKita({...source,level:'Fortgeschrittene',preparationMinutes:10},choice({profession})).eligible,true);
    assert.equal(evaluateKita({...source,preparationMinutes:11},choice({profession})).eligible,false);
  }
  assert.equal(evaluateKita({...source,level:'Experte'},choice({profession:'educatorSport'})).eligible,false);
  assert.equal(evaluateKita({...source,level:'Experte'},choice({profession:'coach'})).eligible,true);
});
test('Kita age and group bounds are inclusive and never guessed',()=>{
  for(const age of [3,6]) assert.equal(evaluateKita(source,choice({age,children:3})).eligible,true);
  for(const age of [6.5,7]) assert.equal(evaluateKita(source,choice({age})).eligible,false);
  assert.equal(evaluateKita({...source,minAge:6},choice({age:5})).eligible,false);
  assert.equal(evaluateKita(source,choice({children:28})).eligible,true);
  for(const children of [2,29]) assert.equal(evaluateKita(source,choice({children})).eligible,false);
  for(const field of ['minAge','minChildren','maxChildren','level','preparationMinutes']) assert.equal(evaluateKita({...source,[field]:null},defaultChoice).eligible,false);
});
test('room limit is 12 only in Kita functional room, not sport hall',()=>{
  assert.equal(evaluateKita(source,choice({room:'Bewegungsraum',children:12})).eligible,true);
  assert.equal(evaluateKita(source,choice({room:'Bewegungsraum',children:13})).eligible,false);
  assert.equal(evaluateKita(source,choice({room:'Sporthalle',children:13})).eligible,true);
  assert.equal(evaluateKita(source,choice({room:'Outdoor',children:13})).eligible,true);
});
test('outdoors requires unambiguous outdoors AND running/catching flag',()=>{
  assert.equal(evaluateKita({...source,outdoors:null,outdoorsRaw:'x (?)'},choice({room:'Outdoor'})).eligible,false);
  assert.equal(evaluateKita({...source,categories:['Ballspiele']},choice({room:'Outdoor'})).eligible,false);
});
test('missing and conditional source cells remain visible and do not turn into defaults',()=>{
  assert.equal(kitaData.records.find(g=>g.preparationRaw==='mimimal').preparationMinutes,0);
  assert.ok(kitaData.records.filter(g=>/abhängig|wenn/i.test(g.levelRaw)).every(g=>g.level===null));
  assert.ok(kitaData.records.some(g=>g.minAge===null));
  assert.equal(kitaData.records.filter(g=>g.issues.length).length,41);
});
test('material filter is identical in finder and coach and cannot be bypassed by test mode',()=>{
  const c=choice({material:'Reifen',useTestProfiles:true});
  const results=findGames(newSession(c).group);assert.ok(results.length);
  assert.ok(results.every(g=>catalogMatch(g,c).eligible && /reifen/i.test(g.materials)));
  assert.deepEqual(findGames(newSession({...c,useTestProfiles:false}).group).map(g=>g.id),results.map(g=>g.id));
});
test('Kita mentions preserve selected persona; location language resolves consistently',()=>{
  const s=newSession(choice({profession:'coach'}));
  assert.equal(understand('10 Kinder in der Kita',s.group).choice.profession,'coach');
  assert.equal(understand('im Funktionsraum Kita',s.group).choice.room,'Bewegungsraum');
  assert.equal(understand('auf dem Außengelände',s.group).choice.room,'Outdoor');
});
test('choose game then theme preserves results and plans, uses exact card reference',()=>{
  let s=localTurn(newSession(),'10 Kinder, 5 Jahre, 20 Minuten');
  const ids=[...s.resultIds];s=localTurn(s,'Ich wähle Spiel 2.');
  assert.equal(s.selectedGameId,ids[1]);assert.match(s.messages.at(-1).text,/Themenwelt/);
  s=localTurn(s,'Erstelle eine Bewegungsgeschichte in der Themenwelt Waldtiere.');
  assert.deepEqual(s.resultIds,ids);assert.equal(s.plans.length,0);assert.match(s.messages.at(-1).text,/keine KI-Beratung/);
  s=localTurn(s,'Einheit für 30 Minuten');
  assert.equal(gameReference('Ich wähle Spiel 2.',s).id,s.resultIds[1]);
});
test('beginner roles keep the explicit category/material chains',()=>{
  const a={...source,id:'a',family:'a',categories:['Materialgewöhnung'],materials:'Reifen'};
  const b={...source,id:'b',family:'b',categories:['Laufspiel'],materials:'Reifen'};
  assert.equal(followsKita(a,b),true);
  assert.equal(followsKita(a,{...b,materials:'Reifen, Bälle'}),false);
  assert.equal(followsKita(a,{...b,level:'Fortgeschrittene'}),false);
  assert.equal(followsKita({...a,categories:['Laufspiel'],materials:'ohne Material'},{...b,categories:['Fangspiel'],materials:'ohne Material'}),true);
});
test('old sessions and foreign game IDs are rejected, including undo history',()=>{
  const s=newSession();assert.deepEqual(restoreSession(JSON.stringify(s)),s);
  assert.throws(()=>restoreSession(JSON.stringify({...s,version:1})));
  assert.throws(()=>restoreSession(JSON.stringify({...s,sourceRevision:'different-workbook'})));
  assert.throws(()=>restoreSession(JSON.stringify({...s,resultIds:['474']})));
  assert.throws(()=>restoreSession(JSON.stringify({...s,selectedGameId:'474'})));
  const p=makePlan(s,'Einheit für 30 Minuten');p.timeline[1].gameId='474';
  assert.throws(()=>restoreSession(JSON.stringify({...s,plans:[p]})));
});

test('plain theme reply does not unexpectedly re-search; explicit material wishes update filters',()=>{
  let s=localTurn(newSession(),'10 Kinder, 5 Jahre');s=localTurn(s,'Ich wähle Spiel 2.');
  const ids=[...s.resultIds];s=localTurn(s,'Waldtiere');assert.deepEqual(s.resultIds,ids);assert.equal(s.messages.at(-1).kind,'explanation');
  s=localTurn(s,'Wir möchten Reifen verwenden.');assert.equal(s.group.choice.material,'Reifen');
  assert.ok(s.resultIds.every(id=>/reifen/i.test(catalog.find(g=>g.id===id).materials)));
  s=localTurn(s,'Wir haben kein Material.');assert.equal(s.group.choice.material,'');
  assert.ok(s.resultIds.every(id=>/ohne|kein/i.test(catalog.find(g=>g.id===id).materials)));
});
test('no automatic unit at 30 minutes; explicit free plans stay inside whitelist',()=>{
  assert.equal(localTurn(newSession(choice({profession:'coach'})),'5 Jahre, 30 Minuten, 12 Kinder').plans.length,0);
  for(const duration of [10,15,20,30,45,60,90]) {
    const s=newSession(choice({duration})),p=makePlan(s,'Einheit erstellen');
    assert.equal(p.timeline.reduce((n,t)=>n+t.duration,0),duration);
    assert.ok(p.timeline.every(t=>catalogMatch(catalog.find(g=>g.id===t.gameId),s.group.choice).eligible));
    assert.match(p.warnings.join(' '),/automatische 30-Minuten-Einheit bleiben offen/);
  }
  assert.throws(()=>makePlan(newSession(),'Einheit erstellen',[],['474','645','638']));
});
test('API rejects invalid profiles and legacy state before calling provider',async()=>{
  for(const state of [{...newSession(),version:1},newSession()]) {
    if(state.version===2)state.group.choice.profession='teacher';
    const response=await POST(new Request('https://local/api/coach',{method:'POST',body:JSON.stringify({prompt:'Hallo',apiKey:'test',state})}));
    assert.equal(response.status,400);
  }
});
