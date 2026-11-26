export type Estado = "Abierto" | "Fondeado" | "Liberado" | "Cancelado";

export type Firmante = { nombre: string; address: string };

export type EscrowDemo = {
  id: number;
  track: string;
  pagador: string;
  beneficiario: string;
  monto: number;
  firmantes: Firmante[];
  umbral: number;
  aprobaron: string[];
  estado: Estado;
};

const KEY = "track-split-escrows-v2";

function leer(): EscrowDemo[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as EscrowDemo[];
  } catch {
    return [];
  }
}

function guardar(lista: EscrowDemo[]) {
  localStorage.setItem(KEY, JSON.stringify(lista));
}

function buscar(lista: EscrowDemo[], id: number) {
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error("Ese escrow no existe.");
  return e;
}

export function listarEscrows(): EscrowDemo[] {
  return leer().sort((a, b) => b.id - a.id);
}

/** Acepta "Nombre: GADDR…" o solo la dirección, una por línea o separadas por coma. */
export function parsearFirmantes(texto: string): Firmante[] {
  return texto
    .split(/[\n,]+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const [a, b] = l.split(":").map((p) => p.trim());
      return b ? { nombre: a, address: b } : { nombre: `Firmante ${i + 1}`, address: a };
    });
}

export function crearEscrow(input: {
  track: string;
  pagador: string;
  beneficiario: string;
  monto: number;
  firmantes: Firmante[];
  umbral: number;
}): EscrowDemo {
  const lista = leer();
  const id = Math.max(0, ...lista.map((e) => e.id)) + 1;
  const e: EscrowDemo = {
    id,
    track: input.track.trim(),
    pagador: input.pagador,
    beneficiario: input.beneficiario.trim(),
    monto: input.monto,
    firmantes: input.firmantes,
    umbral: input.umbral,
    aprobaron: [],
    estado: "Abierto",
  };
  lista.push(e);
  guardar(lista);
  return e;
}

export function depositar(id: number, quien: string): EscrowDemo {
  const lista = leer();
  const e = buscar(lista, id);
  if (e.estado !== "Abierto") throw new Error("Este escrow ya no está abierto.");
  if (e.pagador !== quien) throw new Error("Solo el pagador puede depositar.");
  e.estado = "Fondeado";
  guardar(lista);
  return e;
}

export function aprobar(id: number, firmante: string): EscrowDemo {
  const lista = leer();
  const e = buscar(lista, id);
  if (e.estado !== "Fondeado") throw new Error("El escrow debe estar fondeado para firmar.");
  if (!e.firmantes.some((f) => f.address === firmante)) throw new Error("Esa dirección no es firmante.");
  if (e.aprobaron.includes(firmante)) throw new Error("Ya firmó este escrow.");
  e.aprobaron.push(firmante);
  guardar(lista);
  return e;
}

export function liberar(id: number): EscrowDemo {
  const lista = leer();
  const e = buscar(lista, id);
  if (e.estado !== "Fondeado") throw new Error("El escrow debe estar fondeado.");
  if (e.aprobaron.length < e.umbral) throw new Error("Aún faltan firmas para liberar.");
  e.estado = "Liberado";
  guardar(lista);
  return e;
}

export function cancelar(id: number, quien: string): EscrowDemo {
  const lista = leer();
  const e = buscar(lista, id);
  if (e.estado === "Liberado" || e.estado === "Cancelado") throw new Error("Este escrow ya está cerrado.");
  if (e.pagador !== quien) throw new Error("Solo el pagador puede cancelar.");
  e.estado = "Cancelado";
  guardar(lista);
  return e;
}
