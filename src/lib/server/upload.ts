import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import multer from "multer";
import sharp, { type OutputInfo } from "sharp";
import { ApiError } from "./api";

export const uploadDir = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || "uploads");
export const UPLOAD_NAME = /^[a-f0-9]{32}\.webp$/;

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 2400;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const FORMATS = ["jpeg", "png", "webp", "heif"]; // sharp calls AVIF "heif"

const single = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 2, fieldSize: 1000, parts: 3, headerPairs: 20 },
  fileFilter: (_req, file, done) => {
    if (TYPES.includes(file.mimetype)) done(null, true);
    else done(new ApiError(415, "Use a JPG, PNG, WebP or AVIF picture"));
  },
}).single("file");

const MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: "The picture is larger than 8 MB",
  LIMIT_UNEXPECTED_FILE: "Send one picture, in the field “file”",
};

/** Multer expects Node's request; a route handler gets a web one. Give it the same body and headers as a Node stream. */
export async function readUpload(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data") || !request.body)
    throw new ApiError(415, "Expected a picture");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES + 64 * 1024) throw new ApiError(413, MESSAGES.LIMIT_FILE_SIZE);

  const req = Object.assign(Readable.fromWeb(request.body as ReadableStream), {
    method: request.method,
    headers: Object.fromEntries(request.headers),
  }) as unknown as IncomingMessage & { file?: Express.Multer.File; body?: Record<string, string> };

  await new Promise<void>((resolve, reject) =>
    single(req as never, {} as ServerResponse as never, (error: unknown) => {
      if (!error) return resolve();
      if (error instanceof ApiError) return reject(error);
      const code = error instanceof multer.MulterError ? error.code : "";
      reject(new ApiError(code === "LIMIT_FILE_SIZE" ? 413 : 400, MESSAGES[code] ?? "The upload could not be read"));
    }),
  );
  if (!req.file) throw new ApiError(400, "Choose a picture");
  return { file: req.file, alt: req.body?.alt ?? "" };
}

/**
 * The type a browser claims proves nothing, so the bytes are decoded and written again as WebP: anything that is not a
 * picture fails here, and metadata (GPS position included) is left behind. The name on disk is always our own.
 */
export async function storeImage(bytes: Buffer) {
  let image: { data: Buffer; info: OutputInfo };
  try {
    const { format } = await sharp(bytes).metadata();
    if (!format || !FORMATS.includes(format)) throw new Error(format);
    image = await sharp(bytes, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ApiError(415, "That file is not a picture we can read");
  }
  const name = `${randomBytes(16).toString("hex")}.webp`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), image.data, { flag: "wx" });
  return { path: `/media/${name}`, width: image.info.width, height: image.info.height, size: image.info.size };
}

export async function removeImage(src: string) {
  const name = path.posix.basename(src);
  if (UPLOAD_NAME.test(name)) await rm(path.join(uploadDir(), name), { force: true });
}
