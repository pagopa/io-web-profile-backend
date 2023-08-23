import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { UnlockCode } from "../../generated/definitions/fast-login/UnlockCode";
import { IHslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { unlockSessionHandler } from "../handler";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { Client } from "../../generated/definitions/fast-login/client";
import { UnlockSessionData } from "../../generated/definitions/external/UnlockSessionData";

// #region mocks
const unlockSessionMock = jest.fn(async () =>
  E.right({
    status: 204
  })
);
const fastLoginClientMock = ({
  unlockUserSession: unlockSessionMock
} as unknown) as Client<"ApiKeyAuth">;

const aValidL2User: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L2
};

const aValidL2Payload = {
  unlock_code: "123456789" as UnlockCode
};

const aValidL3User: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L3
};

const aValidL3Payload: UnlockSessionData = {};
// #endregion

// #region tests
describe("UnlockSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid payload and a valid L2 user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = unlockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidL2User, aValidL2Payload);

    expect(unlockSessionMock).toHaveBeenCalledTimes(1);
    expect(unlockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidL2User.fiscal_number,
        unlock_code: aValidL2Payload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });

  test(`GIVEN a valid payload and a valid L3 user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = unlockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidL3User, aValidL3Payload);

    expect(unlockSessionMock).toHaveBeenCalledTimes(1);
    expect(unlockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidL2User.fiscal_number,
        unlock_code: undefined
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });
});
// #endregion
