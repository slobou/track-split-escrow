const KEY = "track-split-address";

export function leerSesion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function guardarSesion(address: string | null) {
  if (address) localStorage.setItem(KEY, address);
  else localStorage.removeItem(KEY);
}
