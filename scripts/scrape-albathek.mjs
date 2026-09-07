import { readFile, writeFile } from "node:fs/promises";

const html = await readFile(process.argv[2], "utf8");
const cards = [];
const seen = new Set();
const cardPattern =
  /<a href="(\/spiele\/[^"]+)"[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

const decode = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();

for (const match of html.matchAll(cardPattern)) {
  const [, href, id, body] = match;
  if (seen.has(id)) continue;

  const title = body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
  const image = body.match(/data-src="([^"]+)"/)?.[1];
  if (!title || !image) continue;

  const kind = body.match(
    /<p class="hidden text-mini[^"]*">([\s\S]*?)<\/p>/,
  )?.[1];
  const audience = body.match(/<p>\s*Spiel für\s*([\s\S]*?)<\/p>/)?.[1];
  const rating = body.match(
    /<span class="sr-only">(\d)\s*von 5 Sterne/,
  )?.[1];

  cards.push({
    id,
    title: decode(title),
    href: `https://albathek.de${href}`,
    image: decode(image),
    kind: kind ? decode(kind) : "Grundspiel",
    audience: audience ? decode(audience) : "Kinder",
    rating: rating ? Number(rating) : null,
    quick: /Schnell vorbereitet/.test(body),
  });
  seen.add(id);
}

if (process.argv.includes("--details")) {
  if (cards.length < 100) throw new Error("Unvollständige Spieleübersicht: vorhandener Katalog bleibt unverändert.");
  // Only public metadata, never videos or protected contents. Four workers,
  // no authentication, a timeout, and no retry storm. Fail rather than replace
  // the checked-in catalogue with a partial import.
  let cursor = 0;
  let completed = 0;
  const failures = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < cards.length) {
      const card = cards[cursor++];
      try {
        const response = await fetch(card.href, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const page = await response.text();
        const sections = [...page.matchAll(/<div class="c-video-content\b[^>]*data-description="([^"]*)"[^>]*data-url="([^"]*)"[^>]*>([\s\S]*?)(?=<div class="c-video-content\b|$)/g)];
        const section = sections.find(s => `https://albathek.de${s[2]}` === card.href);
        if (!section) throw new Error("Originalabschnitt fehlt");
        card.description = decode(section[1]).split(/\s+/).slice(0, 80).join(" ");
        const material = section[3].match(/Benötigtes Material<\/h3>([\s\S]*?)<\/section>/)?.[1] ?? "";
        card.materials = [...material.matchAll(/<div class="ml-3 print:ml-0">([\s\S]*?)<\/li>/g)].map(x => decode(x[1])).join(" · ");
        card.fetchedAt = new Date().toISOString().slice(0, 10);
      } catch (error) { failures.push({ id: card.id, error: error.message }); }
      completed++;
      if (completed % 100 === 0) process.stderr.write(`${completed}/${cards.length} gelesen\n`);
    }
  }));
  if (failures.length) {
    process.stderr.write(`${JSON.stringify(failures)}\n`);
    process.exitCode = 1;
  } else {
    await writeFile(new URL("../app/data/public-games.json", import.meta.url), JSON.stringify(cards, null, 2) + "\n");
    process.stderr.write(`${cards.length} öffentliche Spiele importiert.\n`);
  }
} else process.stdout.write(`${JSON.stringify(cards, null, 2)}\n`);
