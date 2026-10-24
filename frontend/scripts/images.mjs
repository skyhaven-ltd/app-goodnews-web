import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(await readFile(join(root, "scripts", "images.config.json"), "utf8"));
const sourceDir = join(root, config.source);
const outputDir = join(root, config.output);

const listed = new Set([...config.photos, ...config.excluded].map((photo) => photo.source));
const unlisted = (await readdir(sourceDir)).filter((name) => !listed.has(name));
if (unlisted.length > 0) {
  throw new Error(`Photos missing from images.config.json: ${unlisted.join(", ")}`);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

async function render(photo, quality) {
  const upright = await sharp(join(sourceDir, photo.source))
    .rotate()
    .rotate(photo.rotate ?? 0)
    .toBuffer({ resolveWithObject: true });
  const { width, height } = upright.info;
  const cropBottom = photo.cropBottom ?? 0;
  return sharp(upright.data)
    .extract({ left: 0, top: 0, width, height: height - cropBottom })
    .resize({ width: config.maxEdge, height: config.maxEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
}

for (const photo of config.photos) {
  let quality = config.quality;
  let result = await render(photo, quality);
  while (result.info.size > config.maxBytes && quality > config.minQuality) {
    quality -= 4;
    result = await render(photo, quality);
  }
  if (result.info.size > config.maxBytes) {
    throw new Error(`${photo.output} is ${result.info.size} bytes, over ${config.maxBytes}`);
  }
  await writeFile(join(outputDir, photo.output), result.data);
  console.log(`${photo.output} ${result.info.width}x${result.info.height} q${quality} ${Math.round(result.info.size / 1024)} KB`);
}
