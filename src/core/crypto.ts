import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import {promisify} from "node:util";
import {encode, decode} from "@msgpack/msgpack";
import {NarPacker, NarUnpacker} from "@nroot_project/narchive/dist";

export type EncryptionAlgorithm =
  | "aes-256-gcm"
  | "chacha20-poly1305"
  | "aes-128-gcm";
export type CompressionMethod =
  | "none"
  | "lz4"
  | "zstd"
  | "brotli"
  | "gzip"
  | "xz";

export interface NcryptContainer {
  version: number;
  isDir: boolean; // 👈 اضافه شدن کلید برای تشخیص فایل تکی از پوشه
  fileName?: string; // 👈 نگهداری نام اصلی فایل در صورت تکی بودن
  algo: EncryptionAlgorithm;
  compression: CompressionMethod;
  compressionLevel: number;
  salt: string;
  iv: string;
  authTag: string;
  data: Uint8Array;
}

export function cleanPath(inputPath: string): string {
  return inputPath.replace(/^["']|["']$/g, "").trim();
}

export function deriveKey(
  passphrase: string,
  salt: Buffer,
  keyLength = 32,
): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, 100_000, keyLength, "sha256");
}

async function compressData(
  data: Buffer,
  method: CompressionMethod,
  level: number,
): Promise<Buffer> {
  if (method === "none") return data;

  switch (method) {
    case "gzip": {
      const gzipLevel = Math.min(9, Math.max(1, Math.round((level / 15) * 9)));
      return promisify(zlib.gzip)(data, {level: gzipLevel});
    }
    case "brotli": {
      const brotliLevel = Math.min(
        11,
        Math.max(1, Math.round((level / 15) * 11)),
      );
      return promisify(zlib.brotliCompress)(data, {
        params: {[zlib.constants.BROTLI_PARAM_QUALITY]: brotliLevel},
      });
    }
    case "zstd": {
      const zstd = await import("@mongodb-js/zstd");
      return await zstd.compress(data, level);
    }
    case "lz4": {
      const lz4 = await import("lz4");
      return lz4.encode(data);
    }
    case "xz": {
      const lzma = await import("lzma-native");
      return promisify(lzma.compress)(data, level);
    }
    default:
      return data;
  }
}

async function decompressData(
  data: Buffer,
  method: CompressionMethod,
): Promise<Buffer> {
  if (method === "none") return data;

  switch (method) {
    case "gzip":
      return promisify(zlib.gunzip)(data);
    case "brotli":
      return promisify(zlib.brotliDecompress)(data);
    case "zstd": {
      const zstd = await import("@mongodb-js/zstd");
      return await zstd.decompress(data);
    }
    case "lz4": {
      const lz4 = await import("lz4");
      return lz4.decode(data);
    }
    case "xz": {
      const lzma = await import("lzma-native");
      return promisify(lzma.decompress)(data);
    }
    default:
      return data;
  }
}

/**
 * 🔒 بسته‌بندی فایل یا پوشه بدون تداخل با پوشه‌های سیستمی
 */
export async function encryptAndSave(
  sourcePath: string,
  outputPath: string,
  algo: EncryptionAlgorithm,
  compression: CompressionMethod,
  compressionLevel: number,
  passphrase: string,
) {
  const stat = await fs.stat(sourcePath);
  const isDir = stat.isDirectory();
  let rawPayload: Buffer;

  if (isDir) {
    // ۱. اگر پوشه بود، پک کردن توسط NarPacker
    rawPayload = await NarPacker.packToBuffer(sourcePath);
  } else {
    // ۲. اگر فایل تکی بود، خواندن مستقیم فایل
    rawPayload = await fs.readFile(sourcePath);
  }

  // فشرده‌سازی
  const compressedBuffer = await compressData(
    rawPayload,
    compression,
    compressionLevel,
  );

  // رمزنگاری
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt, algo === "aes-128-gcm" ? 16 : 32);

  const cipherAlgo = algo === "chacha20-poly1305" ? "chacha20-poly1305" : algo;
  const cipher = crypto.createCipheriv(cipherAlgo, key, iv);

  const encryptedContent = Buffer.concat([
    cipher.update(compressedBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const container: NcryptContainer = {
    version: 1,
    isDir,
    fileName: isDir ? undefined : path.basename(sourcePath),
    algo,
    compression,
    compressionLevel,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    data: encryptedContent,
  };

  await fs.writeFile(outputPath, encode(container));
}

/**
 * 🔓 استخراج فایل یا پوشه
 */
export async function decryptAndExtract(
  filePath: string,
  outputPath: string,
  passphrase: string,
) {
  const fileContent = await fs.readFile(filePath);
  const container = decode(fileContent) as NcryptContainer;

  const salt = Buffer.from(container.salt, "base64");
  const iv = Buffer.from(container.iv, "base64");
  const authTag = Buffer.from(container.authTag, "base64");

  const key = deriveKey(
    passphrase,
    salt,
    container.algo === "aes-128-gcm" ? 16 : 32,
  );
  const cipherAlgo =
    container.algo === "chacha20-poly1305"
      ? "chacha20-poly1305"
      : container.algo;

  const decipher = crypto.createDecipheriv(cipherAlgo, key, iv);
  decipher.setAuthTag(authTag);

  const decryptedBuffer = Buffer.concat([
    decipher.update(Buffer.from(container.data)),
    decipher.final(),
  ]);

  const rawPayload = await decompressData(
    decryptedBuffer,
    container.compression,
  );

  if (container.isDir) {
    // استخراج پوشه با NArchive
    const {files} = NarUnpacker.unpackFromBuffer(rawPayload);

    for (const [relativePath, content] of files.entries()) {
      const fullPath = path.join(outputPath, relativePath);
      await fs.mkdir(path.dirname(fullPath), {recursive: true});
      await fs.writeFile(fullPath, content);
    }
  } else {
    // ذخیره فایل تکی
    const isOutDir = (
      await fs.stat(outputPath).catch(() => null)
    )?.isDirectory();
    const finalFilePath =
      isOutDir && container.fileName
        ? path.join(outputPath, container.fileName)
        : outputPath;

    await fs.mkdir(path.dirname(finalFilePath), {recursive: true});
    await fs.writeFile(finalFilePath, rawPayload);
  }
}
