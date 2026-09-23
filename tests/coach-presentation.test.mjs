import test from 'node:test';
import assert from 'node:assert/strict';
import { newSession, localTurn, findGames, restoreSession } from '../app/lib/coach.ts';
import { applyCoachConditions, responseBlocks } from '../app/lib/coach-presentation.ts';

test('shared form context updates matches, keeps dialogue and plan history',()=>{
  const state=localTurn(newSession(),'10 Kinder, 5 Jahre, Sporthalle. Spiele finden');
  state.turns=[[{type:'message'}]];
  const next=applyCoachConditions(state,{...state.group.choice,children:6,material:'Reifen'});
  assert.equal(next.group.choice.children,6);
  assert.equal(next.group.choice.material,'Reifen');
  assert.deepEqual(next.resultIds,findGames(next.group).slice(0,6).map(g=>g.id));
  assert.deepEqual(next.messages,state.messages);
  assert.deepEqual(next.plans,state.plans);
  assert.deepEqual(next.turns,[]);
  assert.equal(state.group.choice.children,10);
  assert.deepEqual(restoreSession(JSON.stringify(next)),next);
});
test('material form replaces explicit no-material and old quantity restrictions',()=>{
  let state=localTurn(newSession(),'Ohne Material');
  state=applyCoachConditions(state,{...state.group.choice,material:''});
  assert.equal(state.group.noMaterial,false);
  state=applyCoachConditions(state,{...state.group.choice,material:'Ohne Material'});
  assert.equal(state.group.noMaterial,true);
  state=applyCoachConditions(state,{...state.group.choice,material:'Reifen'});
  assert.equal(state.group.noMaterial,false);
  assert.deepEqual(state.group.excludedMaterials,[]);
  assert.equal(state.group.balls,null);
});
test('profile/group edits reject invalid values without mutating state',()=>{
  const state=newSession(), before=JSON.stringify(state);
  assert.throws(()=>applyCoachConditions(state,{...state.group.choice,children:0}));
  assert.equal(JSON.stringify(state),before);
});
test('response layout renders paragraphs and numbered/bullet lists as text only',()=>{
  const blocks=responseBlocks('Passende Spiele:\n\n1. Spiel eins\n2. Spiel zwei\n\nMaterial:\n- Reifen\n- Bälle\n\n<script>alert(1)</script>');
  assert.deepEqual(blocks.map(b=>b.kind),['paragraph','ordered','paragraph','unordered','paragraph']);
  assert.equal(blocks[1].lines.length,2);
  assert.equal(blocks[4].lines[0],'<script>alert(1)</script>');
});
