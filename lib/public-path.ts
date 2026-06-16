const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const FONT = `${BASE}/fonts/IBMPlexMono-Regular.ttf`;

export function publicPath(path: string): string {
  return `${BASE}${path}`;
}
