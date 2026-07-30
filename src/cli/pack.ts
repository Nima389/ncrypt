import {
  intro,
  outro,
  text,
  select,
  password,
  spinner,
  isCancel,
  cancel,
} from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import fs from "node:fs/promises";
import {
  cleanPath,
  encryptAndSave,
  EncryptionAlgorithm,
  CompressionMethod,
} from "../core/crypto.js";

export interface PackOptions {
  output?: string;
  algo?: EncryptionAlgorithm;
  compression?: CompressionMethod;
  level?: number;
  password?: string;
}

export async function runInteractivePack(
  initialSource?: string,
  options?: PackOptions,
) {
  intro(pc.bgCyan(pc.black(" ncrypt-pack ")));

  // ۱. مسیر ورودی
  let source = initialSource;
  if (!source) {
    const raw = await text({message: "Enter source path (File or Directory):"});
    if (isCancel(raw) || !raw.toString().trim()) {
      cancel("Cancelled.");
      process.exit(0);
    }
    source = raw as string;
  }

  const resolvedSource = path.resolve(cleanPath(source));

  try {
    await fs.stat(resolvedSource);
  } catch {
    cancel(pc.red(`Error: Path does not exist -> ${resolvedSource}`));
    process.exit(1);
  }

  // ۲. الگوریتم رمزنگاری
  let algorithm = options?.algo;
  if (!algorithm) {
    const selected = await select<EncryptionAlgorithm>({
      message: "Select encryption algorithm:",
      initialValue: "aes-256-gcm",
      options: [
        {
          value: "aes-256-gcm",
          label: "AES-256-GCM",
          hint: "Recommended (Fast & Secure)",
        },
        {
          value: "chacha20-poly1305",
          label: "ChaCha20-Poly1305",
          hint: "High performance",
        },
        {value: "aes-128-gcm", label: "AES-128-GCM", hint: "Lightweight"},
      ],
    });
    if (isCancel(selected)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    algorithm = selected as EncryptionAlgorithm;
  }

  // ۳. روش فشرده‌سازی
  let compression = options?.compression;
  if (!compression) {
    const selectedComp = await select<CompressionMethod>({
      message: "Select compression method:",
      initialValue: "zstd",
      options: [
        {value: "none", label: "No Compression", hint: "No compression"},
        {
          value: "zstd",
          label: "Zstandard (zstd)",
          hint: "Best general choice (Fast & high ratio)",
        },
        {value: "lz4", label: "LZ4", hint: "Ultra fast for large files"},
        {value: "brotli", label: "Brotli", hint: "Best for text/web files"},
        {value: "gzip", label: "Gzip", hint: "High compatibility"},
        {value: "xz", label: "XZ / LZMA", hint: "Max compression (Slow)"},
      ],
    });
    if (isCancel(selectedComp)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    compression = selectedComp as CompressionMethod;
  }

  // ۴. دریافت مقدار فشرده‌سازی (۱ تا ۱۵) در صورت انتخاب الگوریتم
  let level = options?.level || 6; // مقدار ديفالت 6
  if (compression !== "none" && !options?.level) {
    const rawLevel = await text({
      message: "Enter compression level (1 to 15):",
      placeholder: "6",
      defaultValue: "6",
      validate(val) {
        const num = Number(val);
        if (isNaN(num) || num < 1 || num > 15)
          return "Please enter a number between 1 and 15";
      },
    });

    if (isCancel(rawLevel)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    level = Number(rawLevel);
  }

  // ۵. رمز عبور
  let passphrase = options?.password;
  if (!passphrase) {
    const rawPass = await password({message: "Enter password:", mask: "*"});
    if (isCancel(rawPass)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    passphrase = rawPass as string;
  }

  // ۶. تعیین مسیر خروجی
  const baseName = path.basename(resolvedSource);
  let finalOutputPath: string;

  if (options?.output) {
    const cleanOut = cleanPath(options.output);
    const resolvedOut = path.resolve(cleanOut);

    if (path.extname(resolvedOut) === ".ncrypt") {
      finalOutputPath = resolvedOut;
    } else {
      finalOutputPath = path.join(resolvedOut, `${baseName}.ncrypt`);
    }
  } else {
    finalOutputPath = path.join(
      path.dirname(resolvedSource),
      `${baseName}.ncrypt`,
    );
  }

  const s = spinner();
  s.start(
    `Building .nar -> Compressing (${compression} Lvl ${level}) -> Encrypting (${algorithm})...`,
  );

  try {
    await encryptAndSave(
      resolvedSource,
      finalOutputPath,
      algorithm,
      compression,
      level,
      passphrase,
    );
    s.stop(`Created ${pc.green(finalOutputPath)}`);
    outro(
      pc.green(
        "✨ Done! Secure .ncrypt package created successfully without temp files.",
      ),
    );
  } catch (err: any) {
    s.stop("Failed!");
    cancel(pc.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
