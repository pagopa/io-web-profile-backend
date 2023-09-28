import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { Client } from "../../generated/definitions/fast-login/client";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { HslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { sessionStateHandler } from "../handler";
import { ExchangeJwtPayloadExtended } from "../../utils/middlewares/exchange-jwt-validation-middleware";
import { TokenTypes } from "../../utils/enums/TokenTypes";

// #region mocks
const aValidSessionState = {
  access_enabled: true,
  session_info: {
    active: true,
    expiration_date: "2023-09-01T12:20:38.936Z"
  }
};

const sessionStateMock = jest.fn(async () =>
  E.right({
    status: 200,
    value: aValidSessionState
  })
);
const sessionStateClientMock = ({
  getUserSessionState: sessionStateMock
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

const aNotValidUser: HslJwtPayloadExtended = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  spid_level: SpidLevel.L1
};

const emptySessionState = {
  access_enabled: false,
  session_info: { active: false, expiration_date: "" }
};
// #endregion

// #region tests
describe("SessionState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([aValidUser, aValidExchangeUser])(
    `GIVEN a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 200`,
    async user => {
      const handler = sessionStateHandler(sessionStateClientMock);

      const res = await handler(user);

      expect(sessionStateMock).toHaveBeenCalledTimes(1);
      expect(sessionStateMock).toHaveBeenCalledWith({
        body: {
          fiscal_code: aValidUser.fiscal_number
        }
      });
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson",
        value: aValidSessionState
      });
    }
  );

  test(`GIVEN a valid user decoded from JWT
        WHEN checks don't pass
        THEN the response is 403`, async () => {
    const handler = sessionStateHandler(sessionStateClientMock);

    const res = await handler(aNotValidUser);

    expect(sessionStateMock).toHaveBeenCalledTimes(0);
    expect(res).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });

  test(`GIVEN a valid user decoded from JWT
    WHEN the client returns an error
      THEN the response should be 502`, async () => {
    const errorStatus = 502;
    sessionStateMock.mockResolvedValueOnce(
      E.right({
        status: errorStatus,
        value: emptySessionState
      })
    );
    const handler = sessionStateHandler(sessionStateClientMock);

    const res = await handler(aValidUser);

    expect(sessionStateMock).toHaveBeenCalledTimes(1);
    expect(sessionStateMock).toHaveBeenCalledWith({
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
    sessionStateMock.mockResolvedValueOnce(
      E.right({
        status: errorStatus,
        value: emptySessionState
      })
    );
    const handler = sessionStateHandler(sessionStateClientMock);

    const res = await handler(aValidUser);

    expect(sessionStateMock).toHaveBeenCalledTimes(1);
    expect(sessionStateMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorGatewayTimeout"
    });
  });

  test(`GIVEN a valid user decoded from JWT
    WHEN the client returns an error
      THEN the response should be 500`, async () => {
    const errorStatus = 500;
    sessionStateMock.mockResolvedValueOnce(
      E.right({
        status: errorStatus,
        value: emptySessionState
      })
    );
    const handler = sessionStateHandler(sessionStateClientMock);

    const res = await handler(aValidUser);

    expect(sessionStateMock).toHaveBeenCalledTimes(1);
    expect(sessionStateMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidUser.fiscal_number
      }
    });
    expect(res).toMatchObject({
      detail: expect.stringContaining(
        "Something gone wrong. Response Status: {500}"
      ),
      kind: "IResponseErrorInternal"
    });
  });
});
// #endregion
