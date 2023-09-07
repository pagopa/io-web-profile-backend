import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { UnlockCode } from "../../generated/definitions/fast-login/UnlockCode";
import { HSLJWTPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { lockSessionHandler } from "../handler";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { Client } from "../../generated/definitions/fast-login/client";
import { ExchangeJwtPayloadExtended } from "../../utils/middlewares/exchange-jwt-validation-middleware";
import { TokenTypes } from "../../utils/enums/TokenTypes";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// #region mocks
const lockSession204Mock = jest.fn(async () =>
  E.right({
    status: 204
  })
);
const fastLoginClient204Mock = ({
  lockUserSession: lockSession204Mock
} as unknown) as Client<"ApiKeyAuth">;

const lockSession409Mock = jest.fn(async () =>
  E.right({
    status: 409
  })
);
const fastLoginClient409Mock = ({
  lockUserSession: lockSession409Mock
} as unknown) as Client<"ApiKeyAuth">;

const aValidUser: HSLJWTPayloadExtended = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  spid_level: SpidLevel.L2
};
const aValidExchangeUser: ExchangeJwtPayloadExtended = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  token_type: TokenTypes.EXCHANGE
};

const aValidPayload = {
  unlock_code: "123456789" as UnlockCode
};
// #endregion

// #region tests
describe("LockSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid unlock_code in payload and a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = lockSessionHandler(fastLoginClient204Mock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSession204Mock).toHaveBeenCalledTimes(1);
    expect(lockSession204Mock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });

  test(`GIVEN a valid unlock_code in payload, a valid user decoded from JWT and fast-login response is 409
        WHEN all checks passed
        THEN the response is 409`, async () => {
    const handler = lockSessionHandler(fastLoginClient409Mock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSession409Mock).toHaveBeenCalledTimes(1);
    expect(lockSession409Mock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorConflict"
    });
  });

  test(`GIVEN a valid unlock_code in payload and a valid magic link user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = lockSessionHandler(fastLoginClient204Mock);

    const res = await handler(aValidExchangeUser, aValidPayload);

    expect(lockSession204Mock).toHaveBeenCalledTimes(1);
    expect(lockSession204Mock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidExchangeUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });
});
// #endregion
