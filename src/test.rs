use super::*;
use soroban_sdk::testutils::storage::Persistent as _;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{vec, String};

fn setup() -> (Env, TrackSplitEscrowClient<'static>) {
    let env = Env::default();
    let id = env.register(TrackSplitEscrow, ());
    let client = TrackSplitEscrowClient::new(&env, &id);
    (env, client)
}

fn firmantes(env: &Env, a: &Address, b: &Address, c: &Address) -> Vec<Address> {
    vec![env, a.clone(), b.clone(), c.clone()]
}

#[test]
fn crea_y_deposita() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let a1 = Address::generate(&env);
    let a2 = Address::generate(&env);
    let track = String::from_str(&env, "Noche en Escazú");

    let id = client.crear(
        &pagador,
        &bene,
        &track,
        &5_000_0000,
        &firmantes(&env, &p, &a1, &a2),
        &2,
    );
    assert_eq!(id, 1);

    let e = client.depositar(&id);
    assert_eq!(e.estado, Estado::Fondeado);
    assert_eq!(e.monto, 5_000_0000);
    assert_eq!(e.track, track);
}

#[test]
fn libera_con_umbral() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let a1 = Address::generate(&env);
    let a2 = Address::generate(&env);

    let id = client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "Demo Track"),
        &100,
        &firmantes(&env, &p, &a1, &a2),
        &2,
    );
    client.depositar(&id);
    client.aprobar(&id, &p);
    assert_eq!(
        client.try_liberar(&id),
        Err(Ok(Error::UmbralNoAlcanzado))
    );
    client.aprobar(&id, &a1);
    let e = client.liberar(&id);
    assert_eq!(e.estado, Estado::Liberado);
    assert_eq!(e.aprobaciones, 2);
}

#[test]
fn no_aprueba_dos_veces() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let a1 = Address::generate(&env);
    let a2 = Address::generate(&env);

    let id = client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "Take 2"),
        &50,
        &firmantes(&env, &p, &a1, &a2),
        &2,
    );
    client.depositar(&id);
    client.aprobar(&id, &p);
    assert_eq!(client.try_aprobar(&id, &p), Err(Ok(Error::YaAprobo)));
    assert!(client.aprobo(&id, &p));
    assert!(!client.aprobo(&id, &a1));
}

#[test]
fn cancela_antes_de_liberar() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let a1 = Address::generate(&env);
    let a2 = Address::generate(&env);

    let id = client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "Descartado"),
        &10,
        &firmantes(&env, &p, &a1, &a2),
        &2,
    );
    let e = client.cancelar(&id);
    assert_eq!(e.estado, Estado::Cancelado);
    assert_eq!(client.try_depositar(&id), Err(Ok(Error::EstadoInvalido)));
}

#[test]
fn monto_cero_falla() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    assert_eq!(
        client.try_crear(
            &pagador,
            &bene,
            &String::from_str(&env, "x"),
            &0,
            &vec![&env, p],
            &1,
        ),
        Err(Ok(Error::MontoCero))
    );
}

#[test]
fn umbral_invalido_falla() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let a1 = Address::generate(&env);
    assert_eq!(
        client.try_crear(
            &pagador,
            &bene,
            &String::from_str(&env, "x"),
            &1,
            &vec![&env, p.clone(), a1],
            &3,
        ),
        Err(Ok(Error::UmbralInvalido))
    );
}

#[test]
fn externo_no_puede_aprobar() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let a1 = Address::generate(&env);
    let a2 = Address::generate(&env);
    let extra = Address::generate(&env);

    let id = client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "Solo firmantes"),
        &20,
        &firmantes(&env, &p, &a1, &a2),
        &2,
    );
    client.depositar(&id);
    assert_eq!(
        client.try_aprobar(&id, &extra),
        Err(Ok(Error::NoEsFirmante))
    );
}

#[test]
#[should_panic]
fn crear_sin_firma_falla() {
    let (env, client) = setup();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "sin auth"),
        &1,
        &vec![&env, p],
        &1,
    );
}

#[test]
fn consultar_inexistente_falla() {
    let (_env, client) = setup();
    assert_eq!(client.try_consultar(&99), Err(Ok(Error::NoExiste)));
}

#[test]
fn ids_secuenciales() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let f = vec![&env, p];
    let t = String::from_str(&env, "A");
    assert_eq!(client.crear(&pagador, &bene, &t, &1, &f, &1), 1);
    assert_eq!(client.crear(&pagador, &bene, &t, &1, &f, &1), 2);
}

#[test]
fn renueva_ttl_al_depositar() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let id = client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "TTL"),
        &1,
        &vec![&env, p],
        &1,
    );
    client.depositar(&id);
    let ttl = env.as_contract(&client.address, || {
        env.storage()
            .persistent()
            .get_ttl(&DataKey::Escrow(id))
    });
    assert_eq!(ttl, 518_400);
}

#[test]
fn depositar_pide_firma_del_pagador() {
    let (env, client) = setup();
    env.mock_all_auths();
    let pagador = Address::generate(&env);
    let bene = Address::generate(&env);
    let p = Address::generate(&env);
    let id = client.crear(
        &pagador,
        &bene,
        &String::from_str(&env, "auth"),
        &1,
        &vec![&env, p],
        &1,
    );
    client.depositar(&id);
    assert_eq!(env.auths()[0].0, pagador);
}
