import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";

let iniciado = false;

function kit() {
  if (!iniciado) {
    StellarWalletsKit.init({ modules: defaultModules(), network: Networks.TESTNET });
    iniciado = true;
  }
  return StellarWalletsKit;
}

export const MENSAJE_RED =
  "Tu wallet está en Main Net. Cámbiala a Testnet en los ajustes de la wallet y vuelve a intentar.";

/** Devuelve true si la wallet está en otra red distinta de Testnet (si la wallet no lo informa, asume que sí). */
export async function redIncorrecta() {
  try {
    const { networkPassphrase } = await kit().getNetwork();
    return !!networkPassphrase && networkPassphrase !== Networks.TESTNET;
  } catch {
    return false;
  }
}

export async function connectWallet() {
  const { address } = await kit().authModal();
  return address;
}

export async function disconnectWallet() {
  await kit().disconnect();
}

export async function signTx(xdr: string, address: string) {
  if (await redIncorrecta()) throw new Error(MENSAJE_RED);
  const { signedTxXdr } = await kit().signTransaction(xdr, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
}
