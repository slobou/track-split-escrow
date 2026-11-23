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

export async function connectWallet() {
  const { address } = await kit().authModal();
  return address;
}

export async function disconnectWallet() {
  await kit().disconnect();
}

export async function signTx(xdr: string, address: string) {
  const { signedTxXdr } = await kit().signTransaction(xdr, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
}
