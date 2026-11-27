import {
  Account,
  BASE_FEE,
  Contract,
  Networks,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import type { EscrowDemo, Estado, Firmante } from "./demo";
import { MENSAJE_RED, signTx } from "./wallet";

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || "CCVMNYMN3FXXXEO347ZIKNXSLI3JKRKJKF3IQ4RYAZLCLKDKQ3Q3BPXR";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const urlFriendbot = (a: string) => `https://friendbot.stellar.org/?addr=${a}`;

export const urlTx = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const urlContrato = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;

let alCambiarFase: ((fase: string) => void) | null = null;
export function escucharFase(fn: ((fase: string) => void) | null) {
  alCambiarFase = fn;
}
const fase = (t: string) => alCambiarFase?.(t);

const server = new rpc.Server(RPC_URL);
const contrato = new Contract(CONTRACT_ID);

const ERRORES: Record<number, string> = {
  1: "El monto debe ser mayor que cero.",
  2: "Hace falta al menos un firmante.",
  3: "Las firmas necesarias deben estar entre 1 y el total de firmantes.",
  4: "Ese escrow no existe.",
  5: "Esa acción no corresponde al estado actual del escrow.",
  6: "Esa cuenta no es firmante de este escrow.",
  7: "Esa cuenta ya firmó este escrow.",
  8: "Aún faltan firmas para liberar.",
};

function textoDe(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const o = err as { message?: unknown; error?: unknown };
    if (typeof o.message === "string") return o.message;
    if (o.error) return textoDe(o.error);
    try {
      return JSON.stringify(err);
    } catch {
      return "";
    }
  }
  return String(err);
}

function traducir(err: unknown): Error {
  const texto = textoDe(err);
  if (/main ?net|test ?net|network passphrase|wrong network/i.test(texto)) return new Error(MENSAJE_RED);
  const m = texto.match(/Error\(Contract, #(\d+)\)/);
  if (m && ERRORES[Number(m[1])]) return new Error(ERRORES[Number(m[1])]);
  if (/account not found|Account not found|status 404/i.test(texto)) {
    return new Error("Tu cuenta no existe en Testnet todavía. Fóndala con Friendbot (enlace abajo) y vuelve a intentar.");
  }
  if (/User declined|rejected|denied|closed|cancel/i.test(texto)) return new Error("Cancelaste la firma en la wallet.");
  if (!texto || texto === "{}") return new Error("La wallet no pudo firmar. Revisa que esté en Testnet y desbloqueada.");
  return new Error(texto.length > 160 ? `${texto.slice(0, 160)}…` : texto);
}

const NOMBRES_KEY = "track-split-nombres";

function leerNombres(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(NOMBRES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function recordarNombres(firmantes: Firmante[]) {
  const n = leerNombres();
  firmantes.forEach((f) => {
    if (!/^Firmante \d+$/.test(f.nombre)) n[f.address] = f.nombre;
  });
  localStorage.setItem(NOMBRES_KEY, JSON.stringify(n));
}

const addr = (a: string) => nativeToScVal(a, { type: "address" });

export function direccionValida(a: string) {
  return StrKey.isValidEd25519PublicKey(a);
}

async function simular(op: xdr.Operation, fuente: string) {
  const tx = new TransactionBuilder(new Account(fuente, "0"), { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(op)
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  if (!("result" in sim) || !sim.result) throw new Error("Sin resultado de la simulación.");
  return scValToNative(sim.result.retval);
}

/** Firma y envía una llamada al contrato. Devuelve el hash y el valor devuelto. */
async function enviar(metodo: string, args: xdr.ScVal[], quien: string) {
  try {
    fase("Preparando la transacción…");
    const cuenta = await server.getAccount(quien);
    const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(contrato.call(metodo, ...args))
      .setTimeout(60)
      .build();
    const lista = await server.prepareTransaction(tx);
    fase("Confirma la firma en tu wallet…");
    const firmada = TransactionBuilder.fromXDR(await signTx(lista.toXDR(), quien), Networks.TESTNET);
    fase("Enviando a Testnet…");
    const envio = await server.sendTransaction(firmada);
    if (envio.status === "ERROR") throw new Error("La red rechazó la transacción.");

    fase("Esperando confirmación de la red…");
    for (let i = 0; i < 30; i++) {
      const r = await server.getTransaction(envio.hash);
      if (r.status === "SUCCESS") {
        return { hash: envio.hash, valor: r.returnValue ? scValToNative(r.returnValue) : undefined };
      }
      if (r.status === "FAILED") throw new Error("La transacción falló en la red.");
      await new Promise((ok) => setTimeout(ok, 1000));
    }
    throw new Error("La red tardó demasiado en confirmar. Revisa el enlace del explorador en unos segundos.");
  } catch (err) {
    throw traducir(err);
  }
}

export async function crearOnChain(
  quien: string,
  d: { track: string; beneficiario: string; monto: number; firmantes: Firmante[]; umbral: number },
) {
  if (!direccionValida(d.beneficiario)) throw new Error("El beneficiario no es una dirección G… válida de Stellar.");
  const malas = d.firmantes.filter((f) => !direccionValida(f.address));
  if (malas.length) throw new Error(`Dirección de firmante no válida: ${malas[0].address.slice(0, 12)}…`);
  const r = await enviar(
    "crear",
    [
      addr(quien),
      addr(d.beneficiario),
      nativeToScVal(d.track, { type: "string" }),
      nativeToScVal(BigInt(d.monto), { type: "i128" }),
      xdr.ScVal.scvVec(d.firmantes.map((f) => addr(f.address))),
      nativeToScVal(d.umbral, { type: "u32" }),
    ],
    quien,
  );
  return { hash: r.hash, id: Number(r.valor) };
}

export const depositarOnChain = (id: number, quien: string) =>
  enviar("depositar", [nativeToScVal(BigInt(id), { type: "u64" })], quien);

export const aprobarOnChain = (id: number, quien: string) =>
  enviar("aprobar", [nativeToScVal(BigInt(id), { type: "u64" }), addr(quien)], quien);

export const liberarOnChain = (id: number, quien: string) =>
  enviar("liberar", [nativeToScVal(BigInt(id), { type: "u64" })], quien);

export const cancelarOnChain = (id: number, quien: string) =>
  enviar("cancelar", [nativeToScVal(BigInt(id), { type: "u64" })], quien);

type EscrowRaw = {
  id: bigint;
  track: string;
  pagador: string;
  beneficiario: string;
  monto: bigint;
  firmantes: string[];
  umbral: number;
  estado: [Estado];
};

async function leerEscrow(id: number, fuente: string): Promise<EscrowDemo | null> {
  let raw: EscrowRaw;
  try {
    raw = (await simular(contrato.call("consultar", nativeToScVal(BigInt(id), { type: "u64" })), fuente)) as EscrowRaw;
  } catch {
    return null;
  }
  const aprobaron: string[] = [];
  await Promise.all(
    raw.firmantes.map(async (f) => {
      const si = await simular(contrato.call("aprobo", nativeToScVal(BigInt(id), { type: "u64" }), addr(f)), fuente);
      if (si) aprobaron.push(f);
    }),
  );
  const nombres = leerNombres();
  return {
    id: Number(raw.id),
    track: raw.track,
    pagador: raw.pagador,
    beneficiario: raw.beneficiario,
    monto: Number(raw.monto),
    firmantes: raw.firmantes.map((address, i) => ({ nombre: nombres[address] || `Firmante ${i + 1}`, address })),
    umbral: raw.umbral,
    aprobaron,
    estado: raw.estado[0],
  };
}

export const leerUno = (id: number, quien: string) => leerEscrow(id, quien);

/** Lee del contrato los escrows donde participa esta cuenta (recorre ids hasta que no existan más). */
export async function listarOnChain(quien: string): Promise<EscrowDemo[]> {
  const out: EscrowDemo[] = [];
  for (let id = 1; id <= 200; id++) {
    const e = await leerEscrow(id, quien);
    if (!e) break;
    const participa =
      e.pagador === quien || e.beneficiario === quien || e.firmantes.some((f) => f.address === quien);
    if (participa) out.push(e);
  }
  return out.sort((a, b) => b.id - a.id);
}
