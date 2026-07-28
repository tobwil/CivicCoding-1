import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("the finder exposes all personalization dimensions", async () => {
  const page = await source("app/page.tsx");

  for (const dimension of [
    "age",
    "size",
    "duration",
    "goal",
    "material",
  ]) {
    assert.match(page, new RegExp(`\\b${dimension}:`));
  }

  assert.match(page, /function scoreGame/);
  assert.match(page, /function reasonFor/);
  assert.match(page, /localStorage\.setItem\("albathek-favorites"/);
  assert.match(page, /https:\/\/albathek\.de\/spiele\//);
});

test("Coach AI supports demo and session-only live settings", async () => {
  const coach = await source("app/components/CoachAI.tsx");

  assert.match(coach, /function buildDemoPlan/);
  assert.match(coach, /sessionStorage\.setItem\("albathek-openai-key"/);
  assert.match(coach, /sessionStorage\.removeItem\("albathek-openai-key"/);
  assert.match(coach, /\/api\/coach/);
  assert.match(coach, /ANKOMMEN/);
  assert.match(coach, /ACTION/);
  assert.match(coach, /LANDEN/);
});

test("the live endpoint constrains models, catalog and output shape", async () => {
  const route = await source("app/api/coach/route.ts");

  assert.match(route, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(route, /store:\s*false/);
  assert.match(route, /allowedModels/);
  assert.match(route, /json_schema/);
  assert.match(route, /strict:\s*true/);
  assert.match(route, /enum:\s*gameCatalog\.map/);
  assert.match(route, /prompt\.length > 800/);
});
