import {
  FeatureFlagEnum,
  getIsUserEligibleForNewFeature
} from "../featureFlags";

const betaTester = ["ISPXNB32R82Y766D"];
const canaryTester = ["ISPXNB32R82Y766X"];

describe(`getIsUserEligibleForNewFeature`, () => {
  it("should succeed in passing the user as eligible when CANARY", async () => {
    const fiscalCode = "ISPXNB32R82Y766X";
    const result = getIsUserEligibleForNewFeature(
      (fc: string) => betaTester.includes(fc),
      (fc: string) => canaryTester.includes(fc),
      FeatureFlagEnum.CANARY
    )(fiscalCode);

    expect(result).toBe(true);
  });

  it("should succeed in passing the user as eligible when NONE", async () => {
    const fiscalCode = "ISPXNB32R82Y766D";
    const result = getIsUserEligibleForNewFeature(
      (fc: string) => betaTester.includes(fc),
      (fc: string) => canaryTester.includes(fc),
      FeatureFlagEnum.NONE
    )(fiscalCode);

    expect(result).toBe(false);
  });
});
