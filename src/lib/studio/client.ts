// Calls to the studio API from the browser

export type Failure = { error: string; fields?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | ({ ok: false } & Failure);

export async function send<T = unknown>(method: string, url: string, data?: unknown): Promise<Result<T>> {
  try {
    const form = data instanceof FormData;
    const response = await fetch(url, {
      method,
      body: data === undefined ? undefined : form ? data : JSON.stringify(data),
      headers: data === undefined || form ? undefined : { "Content-Type": "application/json" },
    });
    const json = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: json as T };
    if (response.status === 401 && !url.endsWith("/login"))
      return { ok: false, error: "You were signed out. Sign in again in another tab, then save." };
    return { ok: false, error: json?.error ?? "Something went wrong on the server", fields: json?.fields };
  } catch {
    return { ok: false, error: "No connection to the server" };
  }
}

export type MediaItem = {
  id: string;
  path: string;
  name: string;
  alt: string;
  draftAlt: string | null;
  decorative: boolean;
  uploaded: boolean;
  width: number;
  height: number;
  size: number;
};

const MOST = 4 * 1024 * 1024; // Vercel takes no request over 4.5 MB

/** Large photos are made smaller in the browser first, to the size the server would keep anyway; null if it cannot read them */
async function lighter(file: File) {
  if (file.size <= MOST) return file;
  try {
    const picture = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / picture.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(picture.width * scale);
    canvas.height = Math.round(picture.height * scale);
    canvas.getContext("2d")!.drawImage(picture, 0, 0, canvas.width, canvas.height);
    picture.close();
    for (const quality of [0.92, 0.8, 0.65]) {
      const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/webp", quality));
      if (blob && blob.size <= MOST) return new File([blob], file.name.replace(/\.\w+$/, "") + (blob.type === "image/webp" ? ".webp" : ".png"), { type: blob.type });
    }
  } catch {
    // not a picture this browser can read
  }
  return null;
}

export async function upload(original: File, alt = "") {
  if (original.size > 40 * 1024 * 1024) return { ok: false as const, error: "The picture is larger than 40 MB" };
  const file = await lighter(original);
  if (!file) return { ok: false as const, error: "The picture is larger than 4 MB and could not be made smaller. Use a smaller one." };
  const form = new FormData();
  form.set("alt", alt); // before the file, so multer has it when the file arrives
  form.set("file", file);
  return send<MediaItem>("POST", "/api/studio/media", form);
}
