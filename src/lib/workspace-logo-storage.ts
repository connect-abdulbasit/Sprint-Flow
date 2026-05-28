import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

export const WORKSPACE_LOGO_UPLOAD_REL = "/uploads/workspaces";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function uploadDir() {
  return join(process.cwd(), "public", "uploads", "workspaces");
}

export async function replaceWorkspaceLogoFile(
  workspaceId: string,
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
    if (f.startsWith(`${workspaceId}.`)) {
      await unlink(join(dir, f)).catch(() => {});
    }
  }

  const filename = `${workspaceId}.${ext}`;
  await writeFile(join(dir, filename), buffer);
  return `${WORKSPACE_LOGO_UPLOAD_REL}/${filename}`;
}

export async function removeWorkspaceLogoFile(publicPath: string) {
  if (!publicPath.startsWith(`${WORKSPACE_LOGO_UPLOAD_REL}/`)) {
    return;
  }
  const name = publicPath.slice(WORKSPACE_LOGO_UPLOAD_REL.length + 1);
  if (!name || name.includes("/") || name.includes("..")) {
    return;
  }
  await unlink(join(uploadDir(), name)).catch(() => {});
}
