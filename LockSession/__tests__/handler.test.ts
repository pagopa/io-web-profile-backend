import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { UnlockCode } from "../../generated/definitions/fast-login/UnlockCode";
import { HslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { lockSessionHandler } from "../handler";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { Client } from "../../generated/definitions/fast-login/client";
import { ExchangeJwtPayloadExtended } from "../../utils/middlewares/exchange-jwt-validation-middleware";
import { TokenTypes } from "../../utils/enums/TokenTypes";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// #region mocks
const lockSessionMock = jest.fn(async () =>
  E.right({
    status: 204
  })
);
const fastLoginClientMock = ({
  lockUserSession: lockSessionMock
} as unknown) as Client<"ApiKeyAuth">;

const aValidUser: HslJwtPayloadExtended = {
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
    const handler = lockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSessionMock).toHaveBeenCalledTimes(1);
    expect(lockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });

  test(`GIVEN a valid unlock_code in payload, a valid user decoded from JWT
        WHEN fast-login response is 409
        THEN the response is 409`, async () => {
    lockSessionMock.mockResolvedValueOnce(E.right({ status: 409 }));
    const handler = lockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSessionMock).toHaveBeenCalledTimes(1);
    expect(lockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorConflict"
    });
  });

  test(`GIVEN a valid unlock_code in payload, a valid user decoded from JWT
        WHEN fast-login response is 502
        THEN the response is 502`, async () => {
    lockSessionMock.mockResolvedValueOnce(E.right({ status: 502 }));
    const handler = lockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSessionMock).toHaveBeenCalledTimes(1);
    expect(lockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorBadGateway",
      detail: expect.stringContaining(`Something gone wrong.`)
    });
  });

  test(`GIVEN a valid unlock_code in payload, a valid user decoded from JWT 
        WHEN fast-login response is 504
        THEN the response is 504`, async () => {
    lockSessionMock.mockResolvedValueOnce(E.right({ status: 504 }));
    const handler = lockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSessionMock).toHaveBeenCalledTimes(1);
    expect(lockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorGatewayTimeout",
      detail: expect.stringContaining(
        `Server couldn't respond in time, try again.`
      )
    });
  });

  test(`GIVEN a valid unlock_code in payload, a valid user decoded from JWT
        WHEN fast-login returns an error
        THEN the response is 500`, async () => {
    const errorStatus = 401;
    lockSessionMock.mockResolvedValueOnce(E.right({ status: errorStatus }));
    const handler = lockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidUser, aValidPayload);

    expect(lockSessionMock).toHaveBeenCalledTimes(1);
    expect(lockSessionMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number,
        unlock_code: aValidPayload.unlock_code
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: expect.stringContaining(
        `Something gone wrong. Response Status: {${errorStatus}}`
      )
    });
  });

  test(`GIVEN a valid unlock_code in payload and a valid magic link user decoded from JWT
        WHEN all checks passed
        THEN the response is 204`, async () => {
    const handler = lockSessionHandler(fastLoginClientMock);

    const res = await handler(aValidExchangeUser, aValidPayload);

    expect(lockSessionMock).toHaveBeenCalledTimes(1);
    expect(lockSessionMock).toHaveBeenCalledWith({
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
