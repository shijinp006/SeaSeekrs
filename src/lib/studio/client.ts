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

export async function upload(file: File, alt = "") {
  if (file.size > 8 * 1024 * 1024) return { ok: false as const, error: "The picture is larger than 8 MB" };
  const form = new FormData();
  form.set("alt", alt); // before the file, so multer has it when the file arrives
  form.set("file", file);
  return send<MediaItem>("POST", "/api/studio/media", form);
}
