# Track Split Escrow

Escrow multisig para lanzamientos musicales en **Stellar Soroban**.

Un pagador (sello, manager o cliente) bloquea un monto para una canción o sesión de estudio. Productor y artistas firman; cuando se alcanza el umbral, los fondos se liberan al beneficiario.

> El contrato registra el estado del escrow on-chain (patrón ledger del bootcamp). No transfiere tokens automáticamente.

## Flujo

1. **Crear** — pagador define track, monto, firmantes y umbral  
2. **Depositar** — pagador confirma el bloqueo  
3. **Aprobar** — cada firmante designado firma una vez  
4. **Liberar** — cualquiera puede liberar al alcanzar el umbral  
5. **Cancelar** — el pagador puede cancelar si aún no se liberó  

## Contrato (Rust / Soroban)

```bash
cargo test
stellar contract build
```

Artefacto: `target/wasm32v1-none/release/track_split_escrow.wasm`

### Funciones

| Función | Descripción |
|---------|-------------|
| `__constructor` | Inicializa el contador de IDs |
| `crear` | Abre un escrow para un track |
| `depositar` | Pagador confirma el depósito |
| `aprobar` | Firmante aprueba la liberación |
| `liberar` | Libera si el umbral se cumplió |
| `cancelar` | Pagador cancela (antes de liberar) |
| `consultar` | Lee el escrow |
| `aprobo` | ¿Ya firmó esta dirección? |

## Frontend

Demo Next.js (estilo clase Oppia) con wallet Stellar Testnet.

```bash
cd frontend
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

```bash
npm run build
```

Variables opcionales en `frontend/.env.local`:

```
NEXT_PUBLIC_CONTRACT_ID=C...
```

Sin `CONTRACT_ID`, la UI corre en **modo demo** (estado local) para recorrer el flujo.
En demo, incluí tu propia dirección entre los firmantes si querés aprobar después.

Más detalle del flujo: [docs/flujo.md](docs/flujo.md).

## Stack

- Soroban SDK 28 / Stellar CLI  
- Next.js + Tailwind + Stellar Wallets Kit  
- Testnet  

## Licencia

Uso educativo — Oppia Bootcamp.
