import assert from "node:assert/strict";
import test from "node:test";
import { games,archiveGames,defaultChoice,evaluateGame,findGames,maximumChildren,minimumAge,calendarFor,allowedSchoolContexts,buildDemoPlan,validateChoice,validatePlan,phaseDurations } from "../app/lib/alba.ts";
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
function aiResponse(value){return Response.json({status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify(value)}]}]});}
function extraction(overrides={}){return {age:null,children:null,duration:null,room:null,preparation:null,sportswear:null,materialGameIds:games.map(g=>g.id),clarification:"",...overrides};}
test("API requires a key and validates context without contacting OpenAI",async()=>{
  assert.equal((await POST(req({prompt:"Hallo",context:defaultChoice}))).status,400);
  assert.equal((await POST(req({prompt:"Hallo",apiKey:"test",context:{}}))).status,400);
  assert.equal((await POST(req({prompt:"x".repeat(801),apiKey:"test",context:defaultChoice}))).status,400);
  assert.equal((await POST(new Request("https://local/api/coach",{method:"POST",body:"bad json"}))).status,400);
});
test("live plan re-filters after extraction and blocks unsuitable material",async()=>{
  const original=globalThis.fetch; let calls=0;
  try{
    globalThis.fetch=async()=>{calls++;return aiResponse(extraction({children:25,room:"Bewegungsraum"}));};
    const response=await POST(req({prompt:"25 Kinder, kleine Halle",apiKey:"test",context:choice({setting:"kita"})}));
    assert.equal(response.status,422);assert.equal(calls,1);
    globalThis.fetch=async()=>aiResponse(extraction({materialGameIds:[]}));
    assert.equal((await POST(req({prompt:"Ohne Material",apiKey:"test",context:defaultChoice}))).status,422);
  }finally{globalThis.fetch=original;}
});
test("live response uses canonical titles, exact minutes and only eligible IDs",async()=>{
  const original=globalThis.fetch; const bodies=[];
  try{
    globalThis.fetch=async(_url,options)=>{
      const b=JSON.parse(options.body);bodies.push(b);
      if(bodies.length===1)return aiResponse(extraction({duration:15}));
      const ids=b.text.format.schema.properties.timeline.items.properties.gameId.enum;
      return aiResponse({headline:"Eine Einheit",read:"Für eure Gruppe",coachNote:"Kurz erklären",timeline:["ANKOMMEN","ACTION","LANDEN"].map((phase,i)=>({phase,gameId:ids[i%ids.length],title:"Wrong title",duration:99,reason:"Passend",tip:"Mitspielen"}))});
    };
    const response=await POST(req({prompt:"15 Minuten",apiKey:"test",context:defaultChoice,excludedIds:[game("Mäuschen aus dem Haus").id]}));
    assert.equal(response.status,200);
    const {plan}=await response.json();
    assert.equal(plan.context.duration,15);
    assert.deepEqual(plan.timeline.map(x=>x.duration),phaseDurations(15));
    assert.ok(plan.timeline.every(x=>x.title===games.find(g=>g.id===x.gameId).title));
    assert.ok(plan.timeline.every(x=>x.gameId!==game("Mäuschen aus dem Haus").id));
    assert.ok(bodies.every(x=>x.store===false));
  }finally{globalThis.fetch=original;}
});
