import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { Client } from "../../generated/definitions/fast-login/client";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { IHslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { logoutHandler } from "../handler";

// #region mocks
const logoutMock = jest.fn(async () =>
  E.right({
    status: 200
  })
);
const fastLoginClientMock = ({
  logoutFromIOApp: logoutMock
} as unknown) as Client<"ApiKeyAuth">;

const aValidUser: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L2
};
// #endregion

// #region tests
describe("Logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 200`, async () => {
    const handler = logoutHandler(fastLoginClientMock);

    const res = await handler(aValidUser);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });
});
// #endregion
