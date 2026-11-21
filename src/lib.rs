//! Track Split Escrow — fondos bloqueados para un lanzamiento musical.
//!
//! El pagador (sello, manager o cliente) deja un monto para una canción o
//! sesión. Productor y artistas firman; al alcanzar el umbral se libera
//! al beneficiario. El contrato registra el escrow (no mueve tokens).
#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Estado {
    Abierto,
    Fondeado,
    Liberado,
    Cancelado,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub track: String,
    pub pagador: Address,
    pub beneficiario: Address,
    pub monto: i128,
    pub firmantes: Vec<Address>,
    pub umbral: u32,
    pub aprobaciones: u32,
    pub estado: Estado,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextId,
    Escrow(u64),
    Aprobo(u64, Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    MontoCero = 1,
    SinFirmantes = 2,
    UmbralInvalido = 3,
    NoExiste = 4,
    EstadoInvalido = 5,
    NoEsPagador = 6,
    NoEsFirmante = 7,
    YaAprobo = 8,
    UmbralNoAlcanzado = 9,
}

#[contract]
pub struct TrackSplitEscrow;

#[contractimpl]
impl TrackSplitEscrow {
    /// Inicializa el contador de escrows.
    pub fn __constructor(env: Env) {
        env.storage().instance().set(&DataKey::NextId, &1u64);
    }

    /// Crea un escrow para `track` con firmantes y umbral de liberación.
    pub fn crear(
        env: Env,
        pagador: Address,
        beneficiario: Address,
        track: String,
        monto: i128,
        firmantes: Vec<Address>,
        umbral: u32,
    ) -> Result<u64, Error> {
        pagador.require_auth();
        if monto <= 0 {
            return Err(Error::MontoCero);
        }
        let n = firmantes.len();
        if n == 0 {
            return Err(Error::SinFirmantes);
        }
        if umbral == 0 || umbral > n {
            return Err(Error::UmbralInvalido);
        }

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(1);
        let escrow = Escrow {
            id,
            track,
            pagador,
            beneficiario,
            monto,
            firmantes,
            umbral,
            aprobaciones: 0,
            estado: Estado::Abierto,
        };
        let key = DataKey::Escrow(id);
        let s = env.storage().persistent();
        s.set(&key, &escrow);
        s.extend_ttl(&key, 17_280, 518_400);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        Ok(id)
    }

    /// El pagador confirma el depósito y deja el escrow en estado Fondeado.
    pub fn depositar(env: Env, id: u64) -> Result<Escrow, Error> {
        let key = DataKey::Escrow(id);
        let s = env.storage().persistent();
        let mut escrow: Escrow = s.get(&key).ok_or(Error::NoExiste)?;
        if escrow.estado != Estado::Abierto {
            return Err(Error::EstadoInvalido);
        }
        escrow.pagador.require_auth();
        escrow.estado = Estado::Fondeado;
        s.set(&key, &escrow);
        s.extend_ttl(&key, 17_280, 518_400);
        Ok(escrow)
    }

    /// Un firmante designado aprueba la liberación del escrow fondeado.
    pub fn aprobar(env: Env, id: u64, firmante: Address) -> Result<Escrow, Error> {
        firmante.require_auth();
        let key = DataKey::Escrow(id);
        let s = env.storage().persistent();
        let mut escrow: Escrow = s.get(&key).ok_or(Error::NoExiste)?;
        if escrow.estado != Estado::Fondeado {
            return Err(Error::EstadoInvalido);
        }
        if !Self::es_firmante(&escrow.firmantes, &firmante) {
            return Err(Error::NoEsFirmante);
        }
        let aprobo_key = DataKey::Aprobo(id, firmante.clone());
        if s.has(&aprobo_key) {
            return Err(Error::YaAprobo);
        }
        s.set(&aprobo_key, &true);
        s.extend_ttl(&aprobo_key, 17_280, 518_400);
        escrow.aprobaciones += 1;
        s.set(&key, &escrow);
        s.extend_ttl(&key, 17_280, 518_400);
        Ok(escrow)
    }

    /// Libera el escrow cuando se alcanza el umbral de firmas.
    pub fn liberar(env: Env, id: u64) -> Result<Escrow, Error> {
        let key = DataKey::Escrow(id);
        let s = env.storage().persistent();
        let mut escrow: Escrow = s.get(&key).ok_or(Error::NoExiste)?;
        if escrow.estado != Estado::Fondeado {
            return Err(Error::EstadoInvalido);
        }
        if escrow.aprobaciones < escrow.umbral {
            return Err(Error::UmbralNoAlcanzado);
        }
        escrow.estado = Estado::Liberado;
        s.set(&key, &escrow);
        s.extend_ttl(&key, 17_280, 518_400);
        Ok(escrow)
    }

    /// El pagador cancela un escrow que aún no fue liberado.
    pub fn cancelar(env: Env, id: u64) -> Result<Escrow, Error> {
        let key = DataKey::Escrow(id);
        let s = env.storage().persistent();
        let mut escrow: Escrow = s.get(&key).ok_or(Error::NoExiste)?;
        if escrow.estado == Estado::Liberado || escrow.estado == Estado::Cancelado {
            return Err(Error::EstadoInvalido);
        }
        escrow.pagador.require_auth();
        escrow.estado = Estado::Cancelado;
        s.set(&key, &escrow);
        s.extend_ttl(&key, 17_280, 518_400);
        Ok(escrow)
    }

    /// Devuelve el escrow o error si no existe.
    pub fn consultar(env: Env, id: u64) -> Result<Escrow, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(id))
            .ok_or(Error::NoExiste)
    }

    /// Indica si `firmante` ya aprobó el escrow.
    pub fn aprobo(env: Env, id: u64, firmante: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Aprobo(id, firmante))
    }

    fn es_firmante(firmantes: &Vec<Address>, quien: &Address) -> bool {
        for f in firmantes.iter() {
            if f == *quien {
                return true;
            }
        }
        false
    }
}

#[cfg(test)]
mod test;
