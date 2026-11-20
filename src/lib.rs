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
}

#[cfg(test)]
mod test;
