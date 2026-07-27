import { readFile } from "node:fs/promises";

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
  const audience = body.match(/Spiel für\s*([\s\S]*?)<\/p>/)?.[1];
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

process.stdout.write(`${JSON.stringify(cards.slice(0, 30), null, 2)}\n`);
