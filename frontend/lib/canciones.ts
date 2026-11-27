"use client";

import { useEffect, useState } from "react";
import { faker } from "@faker-js/faker/locale/en";

const MAX = 22;

const INICIAL = "Sesión de estudio";

export function nombreCancion(): string {
  for (let i = 0; i < 25; i++) {
    const n = faker.music.songName();
    if (n.length <= MAX) return n;
  }
  return faker.music.songName().slice(0, MAX);
}

export function useCancion(): [string, () => void] {
  const [nombre, setNombre] = useState(INICIAL);
  useEffect(() => {
    setNombre(nombreCancion());
  }, []);
  return [nombre, () => setNombre(nombreCancion())];
}
