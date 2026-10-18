export type Provider = {
  id: number;
  tmdbIds: number[];
  name: string;
  color: string;
  logoPath: string;
};

// Tabela de serviços curados (seção 5 da spec, IDs confirmados em 2026-10-18).
// Cores de marca não especificadas na spec; são suposições razoáveis documentadas no relatório.
export const CURATED_PROVIDERS: Provider[] = [
  { id: 8, tmdbIds: [8, 1796], name: "Netflix", color: "#E50914", logoPath: "/rK1KljqmbvO9HQa1PBFLILWah72.png" },
  { id: 119, tmdbIds: [119, 2100], name: "Prime Video", color: "#00A8E1", logoPath: "/gMZdpavHmxFNnLpMHwVxfqeux2g.png" },
  { id: 337, tmdbIds: [337], name: "Disney+", color: "#113CCF", logoPath: "/5eZ872CghnHFLB1j8grszbrx0dx.png" },
  { id: 1899, tmdbIds: [1899], name: "HBO Max", color: "#9B30FF", logoPath: "/skypuy7SXuugIQeYg0IglmzoKaS.png" },
  { id: 307, tmdbIds: [307], name: "Globoplay", color: "#FF2B4E", logoPath: "/9A6Oxd3F7iXm7mds7CxYOBicojs.png" },
  { id: 350, tmdbIds: [350], name: "Apple TV+", color: "#000000", logoPath: "/9icYBfYFcwgCbky5VdGUIKJ4C5i.png" },
  { id: 531, tmdbIds: [531, 2303], name: "Paramount+", color: "#0064FF", logoPath: "/pkx3klJlwW5JdtaulvDx6hDNtch.png" },
  { id: 2302, tmdbIds: [2302], name: "Mercado Play", color: "#2D3277", logoPath: "/1jZnP6bS5nNOqwY7GGJuyLhWEYW.png" },
  { id: 484, tmdbIds: [484], name: "Claro tv+", color: "#DA291C", logoPath: "/olzQMHt2SX7iNy8WDMR299hVFcL.png" },
  { id: 283, tmdbIds: [283], name: "Crunchyroll", color: "#F47521", logoPath: "/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png" },
  { id: 47, tmdbIds: [47], name: "Looke", color: "#FF6B00", logoPath: "/jsAseYgBGuHRkl0sJs9AAQHHU8P.png" },
];

export const HOME_RAIL_PROVIDER_IDS: number[] = [8, 119, 337, 1899, 307, 350];

export function getProvider(id: number): Provider | undefined {
  return CURATED_PROVIDERS.find((p) => p.id === id);
}

export function providerForTmdbId(tmdbId: number): Provider | undefined {
  return CURATED_PROVIDERS.find((p) => p.tmdbIds.includes(tmdbId));
}
