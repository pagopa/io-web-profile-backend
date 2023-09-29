import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { Client } from "../../generated/definitions/fast-login/client";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { HslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { logoutHandler } from "../handler";
import { ExchangeJwtPayloadExtended } from "../../utils/middlewares/exchange-jwt-validation-middleware";
import { TokenTypes } from "../../utils/enums/TokenTypes";

// #region mocks
const logoutMock = jest.fn(async () =>
  E.right({
    status: 204
  })
);
const fastLoginClientMock = ({
  logoutFromIOApp: logoutMock
} as unknown) as Client<"ApiKeyAuth">;

const aValidUser: HslJwtPayloadExtended = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  spid_level: SpidLevel.L2
};
const aExchangeUser: ExchangeJwtPayloadExtended = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  token_type: TokenTypes.EXCHANGE
};
// #endregion

// #region tests
describe("Logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([aValidUser, aExchangeUser])(
    `GIVEN a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`,
    async user => {
      const handler = logoutHandler(fastLoginClientMock);

      const res = await handler(user);

      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(logoutMock).toHaveBeenCalledWith({
        body: {
          fiscal_code: user.fiscal_number
        }
      });
      expect(res).toMatchObject({
        kind: "IResponseSuccessNoContent"
      });
    }
  );

  test(`GIVEN a valid user decoded from JWT
    WHEN the client returns an error
      THEN the response should be 500`, async () => {
    const errorStatus = 500;
    logoutMock.mockResolvedValueOnce(E.right({ status: errorStatus }));
    const handler = logoutHandler(fastLoginClientMock);

    const res = await handler(aValidUser);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number
      }
    });
    expect(res).toMatchObject({
      detail: expect.stringContaining(`${errorStatus}`),
      kind: "IResponseErrorInternal"
    });
  });

  test(`GIVEN a valid user decoded from JWT
    WHEN the client returns an error
      THEN the response should be 502`, async () => {
    const errorStatus = 502;
    logoutMock.mockResolvedValueOnce(E.right({ status: errorStatus }));
    const handler = logoutHandler(fastLoginClientMock);

    const res = await handler(aValidUser);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorBadGateway"
    });
  });

  test(`GIVEN a valid user decoded from JWT
    WHEN the client returns an error
      THEN the response should be 504`, async () => {
    const errorStatus = 504;
    logoutMock.mockResolvedValueOnce(E.right({ status: errorStatus }));
    const handler = logoutHandler(fastLoginClientMock);

    const res = await handler(aValidUser);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorGatewayTimeout"
    });
  });
});
// #endregion
