export enum SpidLevel {
  L1 = "https://www.spid.gov.it/SpidL1",
  L2 = "https://www.spid.gov.it/SpidL2",
  L3 = "https://www.spid.gov.it/SpidL3"
}

type SpidComparison = Record<SpidLevel, ReadonlySet<SpidLevel>>;

const spidComparison: SpidComparison = {
  [SpidLevel.L1]: new Set([SpidLevel.L1]),
  [SpidLevel.L2]: new Set([SpidLevel.L1, SpidLevel.L2]),
  [SpidLevel.L3]: new Set([SpidLevel.L1, SpidLevel.L2, SpidLevel.L3])
};

export const gte = (a: SpidLevel, b: SpidLevel): boolean =>
  spidComparison[a].has(b);
