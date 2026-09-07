import {catalog,searchCatalog,catalogMatch,buildCatalogPlan,validateCatalogPlan,uniqueFamilies} from "../app/lib/catalog.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { games,archiveGames,defaultChoice,evaluateGame,findGames,maximumChildren,minimumAge,calendarFor,allowedSchoolContexts,buildDemoPlan,validateChoice,validatePlan } from "../app/lib/alba.ts";
import { POST } from "../app/api/coach/route.ts";
const game=name=>games.find(g=>g.name===name);
const choice=overrides=>({...defaultChoice,...overrides});
test("ten ALBA rows are complete and keep unknowns unknown",()=>{
  assert.equal(games.length,10); assert.equal(archiveGames.length,8);
  assert.equal(new Set(games.map(g=>g.id)).size,10);
  for(const g of games){assert.ok(g.steps.length>=4);assert.ok(g.materials);assert.ok(g.sourceRow>=2&&g.sourceRow<=11);}
  assert.equal(game("Papprollenangeln").minChildren,null);
  assert.equal(game("Flaschenkegeln").sportswear,null);
  assert.equal(game("Mäuschen aus dem Haus").ageGuided,4.5);
});
test("age threshold changes by actual experience, beginners always use stage 1",()=>{
  const g=game("Gartenzwerge");
  assert.equal(minimumAge(g,choice({experience:1})),7);
  assert.equal(minimumAge(g,choice({experience:2})),6);
  assert.equal(minimumAge(g,choice({experience:3})),9);
  assert.equal(minimumAge(g,choice({profession:"novice",experience:2})),7);
  assert.equal(evaluateGame(g,choice({age:6.5})).eligible,false);
  assert.equal(evaluateGame(g,choice({age:6,experience:2})).eligible,true);
});
test("strict beginner criteria are never relaxed into manufactured matches",()=>{
  for(const setting of ["kita","grundschule","verein"])
    assert.equal(findGames(choice({setting,profession:"novice"})).filter(x=>x.eligible).length,0);
});
test("Kita movement room capacity is one quarter, including boundaries",()=>{
  const g=game("Heiße Kartoffel mit Reifen");
  assert.equal(maximumChildren(g,choice({setting:"kita",room:"Bewegungsraum"})),7);
  assert.equal(evaluateGame(g,choice({setting:"kita",room:"Bewegungsraum",children:7})).eligible,true);
  assert.equal(evaluateGame(g,choice({setting:"kita",room:"Bewegungsraum",children:8})).eligible,false);
  assert.equal(evaluateGame(g,choice({setting:"grundschule",room:"Sporthalle",children:28})).eligible,true);
  assert.equal(evaluateGame(g,choice({children:29})).eligible,false);
});
test("large Kita groups require Outdoor; sport halls cannot override it",()=>{
  const g=game("Mäuschen aus dem Haus");
  assert.equal(evaluateGame(g,choice({setting:"kita",children:12})).eligible,true);
  assert.equal(evaluateGame(g,choice({setting:"kita",children:13})).eligible,false);
  assert.equal(evaluateGame(g,choice({setting:"kita",children:13,room:"Outdoor"})).eligible,true);
  assert.equal(evaluateGame(game("Gartenzwerge"),choice({setting:"kita",children:13,room:"Outdoor"})).eligible,false);
});
test("missing sportswear is not interpreted as no sportswear required",()=>{
  assert.equal(findGames(choice({sportswear:false})).filter(x=>x.eligible).length,0);
  assert.equal(validateChoice(choice({setting:"verein",sportswear:false})).sportswear,true);
});
test("qualified educators do not receive high-rule games",()=>{
  assert.equal(evaluateGame(game("Gartenzwerge"),choice({profession:"educatorSport"})).eligible,false);
  assert.equal(evaluateGame(game("Mäuschen aus dem Haus"),choice({profession:"educatorSport"})).eligible,true);
});
test("school contexts and transition restrictions follow profession",()=>{
  assert.ok(!allowedSchoolContexts(choice({profession:"educator"})).includes("Sportunterricht"));
  assert.ok(allowedSchoolContexts(choice({profession:"teacher"})).includes("Sportunterricht"));
  assert.equal(evaluateGame(game("Gartenzwerge"),choice({schoolContext:"Übergang Kita x Grundschule"})).eligible,false);
  assert.equal(evaluateGame(game("Mäuschen aus dem Haus"),choice({schoolContext:"Übergang Kita x Grundschule"})).eligible,true);
});
test("full text includes themes, materials and accents",()=>{
  assert.ok(findGames(defaultChoice,"Gespenster").some(x=>x.game.name==="Gespensterparty"));
  assert.ok(findGames(defaultChoice,"jahreszeiten").some(x=>x.game.name==="Jahreszeitenlauf"));
  assert.ok(findGames(defaultChoice,"mAUschen").some(x=>x.game.name==="Mäuschen aus dem Haus"));
});
test("30 minute boundary and age route to the supplied calendars",()=>{
  assert.equal(calendarFor(choice({duration:20})),null);
  assert.ok(calendarFor(choice({duration:30,setting:"kita"})).href.endsWith("/kita"));
  assert.ok(calendarFor(choice({duration:45,setting:"verein",age:8})).href.includes("grundschule"));
  assert.ok(calendarFor(choice({duration:45,setting:"verein",age:9})).href.endsWith("/minireihen"));
});
test("offline plans honor counts, exclusions and exact total duration",()=>{
  for(const duration of [10,15,20,30,45,60,90]){
    const p=buildDemoPlan("12 Kinder",choice({duration}));
    assert.equal(p.timeline.reduce((s,x)=>s+x.duration,0),duration);
    assert.ok(p.timeline.every(x=>evaluateGame(games.find(g=>g.id===x.gameId),p.context).eligible));
  }
  const hidden=game("Mäuschen aus dem Haus").id;
  assert.ok(buildDemoPlan("12 Kinder",defaultChoice,[hidden]).timeline.every(x=>x.gameId!==hidden));
  assert.throws(()=>buildDemoPlan("25 Kinder, kleine Halle",choice({setting:"kita"})),/Kein ALBA/);
  assert.throws(()=>buildDemoPlan("ohne Material",defaultChoice),/Materialmengen/);
  assert.equal(buildDemoPlan("6-8 Jahre, 12 Kinder",defaultChoice).context.age,6);
});
test("server validates input ranges and rejects fabricated plans",()=>{
  assert.throws(()=>validateChoice(choice({children:-1})),/gültige/);
  assert.throws(()=>validateChoice(choice({age:NaN})),/gültige/);
  assert.throws(()=>validateChoice(null));
  const p=buildDemoPlan("12 Kinder",defaultChoice);
  p.timeline[0].gameId="invented-game";
  assert.throws(()=>validatePlan(p,defaultChoice,games),/zulässiges/);
});
function req(body){return new Request("https://local/api/coach",{method:"POST",body:JSON.stringify(body)});}

test("API requires a key and validates context without contacting OpenAI",async()=>{
  assert.equal((await POST(req({prompt:"Hallo",context:defaultChoice}))).status,400);
  assert.equal((await POST(req({prompt:"Hallo",apiKey:"test",context:{}}))).status,400);
});
test("public catalogue contains 657 unique linked records and nine optional test profiles",()=>{
  assert.equal(catalog.length,657);
  assert.equal(new Set(catalog.map(g=>g.id)).size,657);
  assert.equal(new Set(catalog.map(g=>g.href)).size,657);
  assert.equal(catalog.filter(g=>g.profile).length,9);
  assert.ok(catalog.every(g=>g.image.startsWith("https://albathek.de/")&&g.description));
  for(const old of archiveGames) assert.ok(catalog.some(g=>g.id===old.id));
  assert.equal(searchCatalog(defaultChoice).length,657);
  assert.ok(searchCatalog(defaultChoice,"Gagaball").length>1);
  assert.ok(searchCatalog(defaultChoice,"Reifen").length>10);
});
test("test profiles supplement, not replace, the public catalogue",()=>{
  const g=catalog.find(g=>g.id==="474");
  assert.equal(catalogMatch(g,choice({age:6})).eligible,true);
  assert.equal(catalogMatch(g,choice({age:6,useTestProfiles:true})).eligible,false);
  assert.ok(searchCatalog(choice({profession:"novice"})).filter(x=>x.eligible).length>100);
  assert.equal(catalogMatch(catalog[0],choice({setting:"kita",age:4})).eligible,false);
});
test("instant plans never repeat games or variants and honor duration/exclusions",()=>{
  for(const duration of [10,15,20,30,45,60,90]) {
    const plan=buildCatalogPlan("12 Kinder",choice({duration}));
    const selected=plan.timeline.map(x=>catalog.find(g=>g.id===x.gameId));
    assert.equal(uniqueFamilies(selected).length,3);
    assert.equal(plan.timeline.reduce((s,x)=>s+x.duration,0),duration);
    assert.ok(plan.timeline.every(x=>!x.gameId.startsWith("alba-")));
  }
  const plan=buildCatalogPlan("6 Kinder, 5 Jahre, Bewegungsraum, 15 Minuten",choice({setting:"kita"}));
  assert.equal(plan.context.age,5);assert.equal(plan.context.children,6);
  assert.equal(uniqueFamilies(plan.timeline.map(x=>catalog.find(g=>g.id===x.gameId))).length,3);
  const hidden=plan.timeline[0].gameId;
  assert.ok(buildCatalogPlan("6 Kinder, 5 Jahre",choice({setting:"kita"}),[hidden]).timeline.every(x=>x.gameId!==hidden));
  assert.throws(()=>buildCatalogPlan("12 Kinder",defaultChoice,catalog.map(g=>g.id)),/drei unterschiedliche/);
});
test("duplicate variants remain rejected by legacy plan validator",()=>{
  const plan=buildCatalogPlan("12 Kinder",defaultChoice);
  plan.timeline[1].gameId=plan.timeline[0].gameId;
  assert.throws(()=>validateCatalogPlan(plan,defaultChoice,catalog),/mehrfach/);
});
