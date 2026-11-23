export type Estado = "Abierto" | "Fondeado" | "Liberado" | "Cancelado";

export type EscrowDemo = {
  id: number;
  track: string;
  pagador: string;
  beneficiario: string;
  monto: number;
  firmantes: string[];
  umbral: number;
  aprobaciones: number;
  aprobaron: string[];
  estado: Estado;
};

const KEY = "track-split-escrows";

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

export function listarEscrows(): EscrowDemo[] {
  return leer().sort((a, b) => b.id - a.id);
}

export function crearEscrow(input: {
  track: string;
  pagador: string;
  beneficiario: string;
  monto: number;
  firmantes: string[];
  umbral: number;
}): EscrowDemo {
  const lista = leer();
  const id = (lista.at(-1)?.id ?? 0) + 1;
  const e: EscrowDemo = {
    id,
    track: input.track.trim(),
    pagador: input.pagador,
    beneficiario: input.beneficiario.trim(),
    monto: input.monto,
    firmantes: input.firmantes.map((f) => f.trim()).filter(Boolean),
    umbral: input.umbral,
    aprobaciones: 0,
    aprobaron: [],
    estado: "Abierto",
  };
  lista.push(e);
  guardar(lista);
  return e;
}

export function depositar(id: number, quien: string): EscrowDemo {
  const lista = leer();
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error("Escrow no existe");
  if (e.estado !== "Abierto") throw new Error("Estado inválido");
  if (e.pagador !== quien) throw new Error("Solo el pagador puede depositar");
  e.estado = "Fondeado";
  guardar(lista);
  return e;
}

export function aprobar(id: number, quien: string): EscrowDemo {
  const lista = leer();
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error("Escrow no existe");
  if (e.estado !== "Fondeado") throw new Error("Debe estar fondeado");
  if (!e.firmantes.includes(quien)) throw new Error("No es firmante");
  if (e.aprobaron.includes(quien)) throw new Error("Ya aprobó");
  e.aprobaron.push(quien);
  e.aprobaciones = e.aprobaron.length;
  guardar(lista);
  return e;
}

export function liberar(id: number): EscrowDemo {
  const lista = leer();
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error("Escrow no existe");
  if (e.estado !== "Fondeado") throw new Error("Estado inválido");
  if (e.aprobaciones < e.umbral) throw new Error("Umbral no alcanzado");
  e.estado = "Liberado";
  guardar(lista);
  return e;
}

export function cancelar(id: number, quien: string): EscrowDemo {
  const lista = leer();
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error("Escrow no existe");
  if (e.estado === "Liberado" || e.estado === "Cancelado") {
    throw new Error("Ya cerrado");
  }
  if (e.pagador !== quien) throw new Error("Solo el pagador puede cancelar");
  e.estado = "Cancelado";
  guardar(lista);
  return e;
}
