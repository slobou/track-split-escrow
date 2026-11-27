# Flujo del producto

## Roles

- **Pagador** — sello, manager o cliente que bloquea el pago de la sesión o el track.
- **Firmantes** — productor y artistas designados al crear el escrow.
- **Beneficiario** — dirección que recibe la liberación (puede ser el productor o una cuenta de split).

## Estados

```
Abierto → Fondeado → Liberado
    \         \
     \---------→ Cancelado
```

1. `crear` deja el escrow en **Abierto**.
2. `depositar` (solo pagador) pasa a **Fondeado**.
3. Cada `aprobar` de un firmante suma una firma (sin repetir).
4. `liberar` exige `aprobaciones >= umbral` y estado Fondeado.
5. `cancelar` (solo pagador) cierra si aún no está Liberado.

## Demo vs on-chain

La UI en `frontend/` tiene dos modos:

- **Wallet conectada (Testnet):** cada acción es una transacción al contrato desplegado, firmada con la wallet. La lista de sesiones se lee del contrato (`consultar` y `aprobo`).
- **Modo demo:** el estado vive en `localStorage`, sin wallet ni red.

El crate Rust en la raíz es la fuente de verdad on-chain (`cargo test` / `stellar contract build`).
