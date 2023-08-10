import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { UnlockCode } from "../../generated/definitions/fast-login/UnlockCode";
import { IHslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { lockSessionHandler } from "../handler";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { Client } from "../../generated/definitions/fast-login/client";

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

const aValidUser: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L2
};

const aValidPayload = {
  unlock_code: "123456789" as UnlockCode
};
// #endregion

// #region tests
describe("LockSession", () => {
  test(`GIVEN a valid unlock_code in payload and a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = lockSessionHandler(fastLoginClient204Mock);

    const res = await handler(aValidUser, aValidPayload);

    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });

  test(`GIVEN a valid unlock_code in payload, a valid user decoded from JWT and fast-login response is 409
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = lockSessionHandler(fastLoginClient409Mock);

    const res = await handler(aValidUser, aValidPayload);

    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });
});
// #endregion
