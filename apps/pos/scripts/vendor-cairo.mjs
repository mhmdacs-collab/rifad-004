import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_COMMIT = "17d93df48cf49fa2e46a9009461f5565e4fced4e";
const SOURCE_ROOTS = [
  `https://raw.githubusercontent.com/fontsource/font-files/${SOURCE_COMMIT}/fonts/google/cairo`,
  `https://cdn.jsdelivr.net/gh/fontsource/font-files@${SOURCE_COMMIT}/fonts/google/cairo`,
];
const outputDir = fileURLToPath(new URL("../public/fonts/cairo/", import.meta.url));

const weights = [400, 500, 600, 700, 800];
const subsets = ["arabic", "latin"];
const files = weights.flatMap((weight) => subsets.map((subset) => `cairo-${subset}-${weight}-normal.woff2`));
const MAX_DOWNLOAD_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isValidWoff2 = async (path) => {
  try {
    const file = await readFile(path);
    return file.length > 1024 && file.subarray(0, 4).toString("ascii") === "wOF2";
  } catch {
    return false;
  }
};

const retryDelayMs = (attempt, response) => {
  const retryAfter = response?.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(10_000, Math.max(500, retryAfterSeconds * 1000));
  }
  return Math.min(4_000, 600 * (2 ** (attempt - 1)));
};

const fetchWithRetry = async (sourceUrl) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, { headers: { "user-agent": "Rifad-POS-build" } });
      if (response.ok) return response;

      const error = new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_DOWNLOAD_ATTEMPTS) throw error;
      lastError = error;
      await sleep(retryDelayMs(attempt, response));
    } catch (error) {
      if (attempt === MAX_DOWNLOAD_ATTEMPTS) throw error;
      lastError = error;
      await sleep(retryDelayMs(attempt));
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${sourceUrl}`);
};

const fetchFromSources = async (relativePath) => {
  let lastError = null;

  for (const root of SOURCE_ROOTS) {
    const sourceUrl = `${root}/${relativePath}`;
    try {
      return { response: await fetchWithRetry(sourceUrl), sourceUrl };
    } catch (error) {
      lastError = error;
      console.warn(`Cairo source unavailable, trying mirror: ${sourceUrl}`);
    }
  }

  throw lastError ?? new Error(`Failed to fetch Cairo asset ${relativePath}`);
};

const download = async (relativePath, destination, validateWoff2 = false) => {
  if (process.env.RIFAD_REFRESH_FONTS !== "1") {
    if (validateWoff2 ? await isValidWoff2(destination) : await stat(destination).then(() => true, () => false)) return;
  }

  const { response, sourceUrl } = await fetchFromSources(relativePath);
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
  await download(`files/${file}`, join(outputDir, file), true);
}

await download("LICENSE", join(outputDir, "OFL-1.1.txt"));

console.log(`Cairo vendored locally (${files.length} WOFF2 files, source ${SOURCE_COMMIT.slice(0, 12)}).`);
