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
