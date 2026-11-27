# Track Split Escrow

Contrato inteligente en **Stellar (Soroban)** para que un pago por una canción o sesión de estudio solo se libere cuando el equipo lo apruebe.

- **App:** https://track-split-escrow.vercel.app
- **Red:** Stellar **Testnet** (nunca mainnet, sin dinero real)
- **Contrato:** Rust + Soroban SDK 28, con 15 pruebas automáticas

> Ejercicio práctico individual del Oppia Bootcamp. No es la idea para la hackathon.

---

## El problema

Cuando una banda, un productor y un sello trabajan en un track, el pago suele coordinarse por mensajes y se hace con una transferencia (en Costa Rica, por ejemplo, un SINPE Móvil). Lo que casi nunca queda claro es **quién tenía que aprobar qué antes de pagar**.

Pasa algo así:

1. El sello le paga al productor por la sesión.
2. Después, la voz principal dice que nunca aprobó la mezcla.
3. Nadie puede demostrar quién estaba de acuerdo ni cuándo.

El problema, dicho en una línea: **no hay un acuerdo verificable de quién debe aprobar un pago antes de que se haga.**

### Por qué elegí este problema

- Es **pequeño y concreto**: una canción, un monto, unas pocas personas.
- Es **real** para cualquiera que trabaje en equipo con dinero de por medio (música, diseño, audiovisual, eventos). La música es solo el ejemplo.
- Encaja con lo visto en clase: una blockchain sirve justamente para guardar un estado que **todos pueden ver** y que **nadie puede cambiar a escondidas**.
- Permite practicar lo importante del bootcamp: `require_auth`, almacenamiento persistente con TTL, errores propios y pruebas.

---

## Qué es (en simple)

Un **escrow** es un "depósito en garantía": el dinero queda apartado y solo se entrega cuando se cumple una condición. **Multifirma** significa que esa condición es que varias personas aprueben, no solo una.

Este contrato junta las dos ideas:

1. El **pagador** crea una sesión: nombre del track, monto, quiénes firman y **cuántas firmas hacen falta** (el umbral, por ejemplo 2 de 3).
2. El pagador confirma el depósito y la sesión queda **bloqueada**.
3. Cada **firmante** designado aprueba desde su propia wallet. Nadie puede firmar dos veces y nadie fuera de la lista puede firmar.
4. Cuando se llega al umbral, la sesión se puede **liberar** al beneficiario. Antes de eso, es imposible.
5. Si algo sale mal, el pagador puede **cancelar** mientras no se haya liberado.

Las reglas (quién firma y cuántas firmas hacen falta) quedan fijadas al crear la sesión y no se pueden cambiar después.

### Estados

```
Abierto ──depositar──▶ Fondeado ──liberar──▶ Liberado
   │                      │
   └──────cancelar────────┴────────────────▶ Cancelado
```

| Estado | Significado |
|--------|-------------|
| `Abierto` | La sesión existe pero aún no se bloquean fondos |
| `Fondeado` | Fondos bloqueados; se están recolectando firmas |
| `Liberado` | Se alcanzó el umbral y se liberó al beneficiario |
| `Cancelado` | El pagador cerró la sesión antes de liberar |

---

## El contrato

Código en [`src/lib.rs`](src/lib.rs). Sigue el patrón de las clases: `__constructor`, un `enum DataKey` para el almacenamiento, `require_auth` para las firmas, datos persistentes con `extend_ttl` y errores propios con `#[contracterror]`.

### Funciones

| Función | Quién la firma | Qué hace |
|---------|----------------|----------|
| `__constructor` | quien despliega | Inicia el contador de IDs |
| `crear` | pagador | Abre una sesión con track, monto, firmantes y umbral |
| `depositar` | pagador | Confirma el depósito: `Abierto` → `Fondeado` |
| `aprobar` | firmante | Suma una firma (una sola vez por persona) |
| `liberar` | cualquiera | Pasa a `Liberado` si `firmas >= umbral` |
| `cancelar` | pagador | Pasa a `Cancelado` si aún no se liberó |
| `consultar` | nadie | Lee la sesión |
| `aprobo` | nadie | Responde si una dirección ya firmó |

### Errores

| Código | Error | Cuándo ocurre |
|--------|-------|---------------|
| 1 | `MontoCero` | El monto es 0 o negativo |
| 2 | `SinFirmantes` | La lista de firmantes está vacía |
| 3 | `UmbralInvalido` | El umbral es 0 o mayor que la cantidad de firmantes |
| 4 | `NoExiste` | El ID de sesión no existe |
| 5 | `EstadoInvalido` | La acción no corresponde al estado actual |
| 6 | `NoEsFirmante` | Una dirección que no está en la lista intentó firmar |
| 7 | `YaAprobo` | El firmante ya había firmado |
| 8 | `UmbralNoAlcanzado` | Se quiso liberar sin las firmas necesarias |

---

## Cómo correrlo

### Requisitos

- [Rust](https://rustup.rs) con el target de Soroban: `rustup target add wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli)

### Contrato

```bash
cargo test                # corre las 15 pruebas
stellar contract build    # genera el .wasm
```

El artefacto queda en `target/wasm32v1-none/release/track_split_escrow.wasm`.

### Desplegarlo y probarlo en Testnet

Los comandos que se usaron para la [prueba real](#prueba-real-en-stellar-testnet):

```bash
stellar keys generate pagador --network testnet --fund

stellar contract deploy \
  --wasm target/wasm32v1-none/release/track_split_escrow.wasm \
  --source-account pagador --network testnet

stellar contract invoke --id <ID_DEL_CONTRATO> --source-account pagador --network testnet \
  -- crear --pagador pagador --beneficiario <G...> --track "Single de verano" \
  --monto 1000 --firmantes '["<G_productor>","<G_artista>"]' --umbral 2
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

- `/` — landing: qué es, cómo funciona y una mezcladora interactiva para ver las firmas.
- `/estudio` — la app: conectar wallet (o modo demo), crear sesiones, bloquear, firmar y liberar.

---

## Pruebas

`cargo test` → **15 passed, 0 failed**. Cada prueba verifica una regla del contrato:

| Prueba | Qué comprueba |
|--------|---------------|
| `crea_y_deposita` | Se crea una sesión y pasa a `Fondeado` con sus datos correctos |
| `libera_con_umbral` | Con 1 de 2 firmas no libera; con 2 de 2 sí |
| `no_aprueba_dos_veces` | Un firmante no puede firmar dos veces (`YaAprobo`) |
| `externo_no_puede_aprobar` | Alguien fuera de la lista no puede firmar (`NoEsFirmante`) |
| `cancela_antes_de_liberar` | El pagador cancela y ya no se puede depositar |
| `monto_cero_falla` | Rechaza montos en 0 (`MontoCero`) |
| `umbral_invalido_falla` | Rechaza un umbral mayor que los firmantes |
| `crear_sin_firma_falla` | Sin la firma del pagador, no se crea nada |
| `depositar_pide_firma_del_pagador` | Quien debe autorizar el depósito es el pagador |
| `consultar_inexistente_falla` | Consultar un ID inexistente da `NoExiste` |
| `ids_secuenciales` | Cada sesión recibe un ID nuevo (1, 2, …) |
| `renueva_ttl_al_depositar` | Los datos se mantienen vivos (TTL renovado) |
| `no_se_aprueba_sin_depositar` | No se puede firmar antes de bloquear fondos |
| `no_se_libera_sin_depositar` | No se puede liberar antes de bloquear fondos |
| `no_se_cancela_un_escrow_liberado` | Una sesión liberada ya no se puede cancelar |

---

## Prueba real en Stellar Testnet

El contrato está desplegado y se ejecutó el flujo completo con 4 cuentas de prueba (pagador, productor, voz principal y beneficiario). Cualquiera puede verificarlo en el explorador:

**Contrato:** [`CCVMNYMN3FXXXEO347ZIKNXSLI3JKRKJKF3IQ4RYAZLCLKDKQ3Q3BPXR`](https://stellar.expert/explorer/testnet/contract/CCVMNYMN3FXXXEO347ZIKNXSLI3JKRKJKF3IQ4RYAZLCLKDKQ3Q3BPXR)

| Paso | Quién firma | Resultado | Transacción |
|------|-------------|-----------|-------------|
| Despliegue | pagador | Contrato creado | [818907b1…](https://stellar.expert/explorer/testnet/tx/818907b122b36e5bf3c5eadd130cff748732afdffe4d581f2b6b1c94dd8a8fb5) |
| `crear` ("Single de verano", 1500, umbral 2 de 2) | pagador | Devuelve el id `1` | [9dd263f7…](https://stellar.expert/explorer/testnet/tx/9dd263f7780d3a3518e7003916dc55df594c447ec72823587b56dee7de8f3382) |
| `depositar` | pagador | Estado `Fondeado` | [3c66f65c…](https://stellar.expert/explorer/testnet/tx/3c66f65c6354d54e1f4a5b14a2519b4400b607136496b4f9575f94d82c536a34) |
| `liberar` sin firmas | pagador | **Rechazado**: `Error #8 UmbralNoAlcanzado` | (no llega a la red) |
| `aprobar` | productor | 1 de 2 firmas | [985a3c9c…](https://stellar.expert/explorer/testnet/tx/985a3c9c8f97d4b12f8d08fe96c01adee47a0e8d9b0a9b15541422c60cc40091) |
| `aprobar` | voz principal | 2 de 2 firmas | [86914189…](https://stellar.expert/explorer/testnet/tx/8691418942e0ca62ae92f5b7b48ee74e90ec09de5a678cecf4ef96ca637b8ced) |
| `liberar` | pagador | Estado `Liberado` | [195a2abc…](https://stellar.expert/explorer/testnet/tx/195a2abc1f1541ea12b7fef38b15284ecec4d6d79daf7e23056d0207196e75a1) |

Para comprobar el resultado final directamente desde la red:

```bash
stellar contract invoke --id CCVMNYMN3FXXXEO347ZIKNXSLI3JKRKJKF3IQ4RYAZLCLKDKQ3Q3BPXR \
  --network testnet --source-account <tu_cuenta> -- consultar --id 1
```

Devuelve el escrow con `"estado":"Liberado"` y `"aprobaciones":2`.

---

## Alcance y límites

Esta es una práctica, así que el alcance es intencionalmente chico:

- **El contrato registra el estado y las firmas, pero todavía no mueve tokens.** `depositar` y `liberar` cambian el estado on-chain; la transferencia real de fondos (con un token de Stellar) sería el siguiente paso.
- **El estudio web usa una demo local.** La wallet (Freighter u otras, vía Stellar Wallets Kit) identifica al pagador, pero los escrows del estudio se guardan en el navegador (`localStorage`) y todavía no se envían al contrato desplegado.
- Cualquiera puede llamar `liberar` una vez cumplido el umbral; no le da ventaja a nadie porque el destino ya está fijado.

Más detalle del flujo en [docs/flujo.md](docs/flujo.md).

## Stack

- Soroban SDK 28 y Stellar CLI
- Next.js, Tailwind, Stellar Wallets Kit, motion y Faker.js (nombres de ejemplo)
- Stellar Testnet

## Licencia

Uso educativo — Oppia Bootcamp.
