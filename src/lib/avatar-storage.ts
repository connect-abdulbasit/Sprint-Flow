import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

export const AVATAR_UPLOAD_REL = "/uploads/avatars";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function uploadDir() {
  return join(process.cwd(), "public", "uploads", "avatars");
}

export async function replaceAvatarFile(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = MIME_TO_EXT[mimeType];
  if (!ext) {
    throw new Error("Unsupported image type");
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const files = await readdir(dir).catch(() => [] as string[]);
  for (const f of files) {
    if (f.startsWith(`${userId}.`)) {
      await unlink(join(dir, f)).catch(() => {});
    }
  }

  const filename = `${userId}.${ext}`;
  await writeFile(join(dir, filename), buffer);
  // Cache-bust so browsers pick up replacements at the same path stem.
  return `${AVATAR_UPLOAD_REL}/${filename}?v=${Date.now()}`;
}

export async function removeAvatarFile(publicPath: string | null | undefined) {
  if (!publicPath) return;
  const pathOnly = publicPath.split("?")[0] ?? publicPath;
  if (!pathOnly.startsWith(`${AVATAR_UPLOAD_REL}/`)) {
    return;
  }
  const name = pathOnly.slice(AVATAR_UPLOAD_REL.length + 1);
  if (!name || name.includes("/") || name.includes("..")) {
    return;
  }
  await unlink(join(uploadDir(), name)).catch(() => {});
}
