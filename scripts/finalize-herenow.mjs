import { copyFile, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist-static");
const indexPath = resolve(dist, "index.html");
const tarPath = "/tmp/civiccoding-herenow.tar.gz";
const indexHtml = await readFile(indexPath, "utf8");

await copyFile(indexPath, resolve(dist, "404.html"));
await writeFile(
  resolve(dist, "_redirects"),
  "/*    /index.html   200\n",
  "utf8",
);

if (!indexHtml.includes("<div id=\"root\">") && !indexHtml.includes("<div id='root'>")) {
  throw new Error("Static build is missing #root; index.html is not an SPA shell.");
}
if (!indexHtml.includes("/assets/")) {
  throw new Error("Static build is missing hashed assets under /assets/.");
}

const packed = spawnSync(
  "tar",
  ["-czf", tarPath, "-C", dist, "."],
  { stdio: "inherit" },
);
if (packed.status !== 0) {
  throw new Error("Failed to pack /tmp/civiccoding-herenow.tar.gz");
}

process.stdout.write(
  "here.now static dist ready (index.html + 404.html SPA fallback)\n",
);
process.stdout.write(`packed ${tarPath}\n`);
