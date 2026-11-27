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

Next.js (estilo clase Oppia) con **Stellar Testnet**. Nunca usa mainnet: la wallet se inicializa con `Networks.TESTNET`.

- `/` — landing: qué es, cómo funciona y una mezcladora interactiva.
- `/estudio` — la app: conectar wallet (o modo demo), crear sesiones, bloquear fondos, firmar y liberar.

```bash
cd frontend
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

```bash
npm run build
```

### Estado actual

La wallet (Freighter u otras vía Stellar Wallets Kit) identifica al pagador. El libro de escrows del estudio es una **demo local** (`localStorage`); todavía no firma transacciones contra el contrato desplegado.

Los nombres de canción de los ejemplos se generan con [Faker.js](https://fakerjs.dev).

Más detalle del flujo: [docs/flujo.md](docs/flujo.md).

## Stack

- Soroban SDK 28 / Stellar CLI  
- Next.js + Tailwind + Stellar Wallets Kit + motion  
- Testnet  

## Licencia

Uso educativo — Oppia Bootcamp.
