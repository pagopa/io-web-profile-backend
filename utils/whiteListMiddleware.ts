import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Request, Response, NextFunction } from "express";
import { FeatureFlag, getIsUserEligibleForNewFeature } from "./featureFlags";
import { BETA_TESTERS, getConfigOrThrow } from "./config";
import { IJWTUser, checkBearerToken } from "./jwt";

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

export const checkWhiteListMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userFromToken: IJWTUser = checkBearerToken(req);
  if (userFromToken.fiscal_number !== "") {
    if (!isUserElegible(userFromToken.fiscal_number as FiscalCode)) {
      res.status(401).json({
        fiscal_number: userFromToken?.fiscal_number,
        message: "Not Authorized"
      });
    } else {
      next();
    }
  } else {
    res.status(401).json({
      fiscal_number: userFromToken?.fiscal_number,
      message: "Missing Fiscal Code"
    });
  }
};
