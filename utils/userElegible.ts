import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { FeatureFlag, getIsUserEligibleForNewFeature } from "./featureFlags";
import { BETA_TESTERS, getConfigOrThrow } from "./config";

const config = getConfigOrThrow();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getIsUserElegibleIoWebProfile = (
  betaTester: ReadonlyArray<FiscalCode>,
  apiEnabled: FeatureFlag
) =>
  getIsUserEligibleForNewFeature<FiscalCode>(
    fiscalCode => betaTester.includes(fiscalCode),
    _fiscalCode => false,
    apiEnabled
  );

export const isUserElegible = getIsUserElegibleIoWebProfile(
  BETA_TESTERS,
  config.FF_API_ENABLED
);
