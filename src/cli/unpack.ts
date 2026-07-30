import {
  intro,
  outro,
  text,
  password,
  spinner,
  isCancel,
  cancel,
} from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import {cleanPath, decryptAndExtract} from "../core/crypto.js";

export interface UnpackOptions {
  output?: string;
  password?: string;
}

export async function runInteractiveUnpack(
  initialFile?: string,
  options?: UnpackOptions,
) {
  intro(pc.bgMagenta(pc.black(" ncrypt-unpack ")));

  let file = initialFile;
  if (!file) {
    const raw = await text({message: "Enter .ncrypt file path:"});
    if (isCancel(raw) || !raw.toString().trim()) {
      cancel("Cancelled.");
      process.exit(0);
    }
    file = raw as string;
  }

  let passphrase = options?.password;
  if (!passphrase) {
    const rawPass = await password({message: "Enter password:", mask: "*"});
    if (isCancel(rawPass)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    passphrase = rawPass as string;
  }

  const resolvedFile = path.resolve(cleanPath(file));
  const outputDir = options?.output
    ? path.resolve(cleanPath(options.output))
    : path.dirname(resolvedFile);
  const originalFileName = path.basename(resolvedFile, ".ncrypt");
  const finalOutputPath = path.join(outputDir, originalFileName);

  const s = spinner();
  s.start("Decrypting file...");

  try {
    await decryptAndExtract(resolvedFile, finalOutputPath, passphrase);
    s.stop(`Unpacked to ${pc.green(finalOutputPath)}`);
    outro(pc.green("✨ Done!"));
  } catch (err: any) {
    s.stop("Failed!");
    cancel(pc.red("Error: Invalid password or corrupted file."));
    process.exit(1);
  }
}
