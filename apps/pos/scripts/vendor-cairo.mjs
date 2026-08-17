import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_COMMIT = "17d93df48cf49fa2e46a9009461f5565e4fced4e";
const SOURCE_ROOT = `https://raw.githubusercontent.com/fontsource/font-files/${SOURCE_COMMIT}/fonts/google/cairo`;
const outputDir = fileURLToPath(new URL("../public/fonts/cairo/", import.meta.url));

const weights = [400, 500, 600, 700, 800];
const subsets = ["arabic", "latin"];
const files = weights.flatMap((weight) => subsets.map((subset) => `cairo-${subset}-${weight}-normal.woff2`));

const isValidWoff2 = async (path) => {
  try {
    const file = await readFile(path);
    return file.length > 1024 && file.subarray(0, 4).toString("ascii") === "wOF2";
  } catch {
    return false;
  }
};

const download = async (sourceUrl, destination, validateWoff2 = false) => {
  if (process.env.RIFAD_REFRESH_FONTS !== "1") {
    if (validateWoff2 ? await isValidWoff2(destination) : await stat(destination).then(() => true, () => false)) return;
  }

  const response = await fetch(sourceUrl, { headers: { "user-agent": "Rifad-POS-build" } });
  if (!response.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (validateWoff2 && (bytes.length <= 1024 || bytes.subarray(0, 4).toString("ascii") !== "wOF2")) {
    throw new Error(`Invalid WOFF2 payload received for ${sourceUrl}`);
  }

  const temp = `${destination}.tmp`;
  await writeFile(temp, bytes);
  await unlink(destination).catch(() => undefined);
  await rename(temp, destination);
};

await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await download(`${SOURCE_ROOT}/files/${file}`, join(outputDir, file), true);
}

await download(`${SOURCE_ROOT}/LICENSE`, join(outputDir, "OFL-1.1.txt"));

console.log(`Cairo vendored locally (${files.length} WOFF2 files, source ${SOURCE_COMMIT.slice(0, 12)}).`);
