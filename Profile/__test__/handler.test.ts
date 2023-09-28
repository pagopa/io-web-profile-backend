import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { Client } from "../../generated/definitions/io-functions-app/client";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { HslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { profileHandler } from "../handler";
import { TokenTypes } from "../../utils/enums/TokenTypes";
import { ExchangeJwtPayloadExtended } from "../../utils/middlewares/exchange-jwt-validation-middleware";

// #region mocks
const aValidEmailResponse = {
  email: "example@test.com"
};

const getProfileMock = jest.fn(async () =>
  E.right({
    status: 200,
    value: aValidEmailResponse
  })
);
const functionsAppClientMock = ({
  getProfile: getProfileMock
} as unknown) as Client<"SubscriptionKey">;

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
// #endregion

// #region tests
describe("Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([aValidUser, aValidExchangeUser])(
    `GIVEN a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 200 and contains the email`,
    async user => {
      const handler = profileHandler(functionsAppClientMock);

      const res = await handler(user);

      expect(getProfileMock).toHaveBeenCalledTimes(1);
      expect(getProfileMock).toHaveBeenCalledWith({
        fiscal_code: aValidUser.fiscal_number
      });
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson",
        value: aValidEmailResponse
      });
    }
  );

  test(`GIVEN a valid user decoded from JWT
        WHEN functions-app do not find the user
        THEN the response is 404`, async () => {
    const errorStatus = 404;
    getProfileMock.mockResolvedValueOnce(
      E.right({ status: errorStatus, value: { email: "" } })
    );
    const handler = profileHandler(functionsAppClientMock);

    const res = await handler(aValidUser);

    expect(getProfileMock).toHaveBeenCalledTimes(1);
    expect(getProfileMock).toHaveBeenCalledWith({
      fiscal_code: aValidUser.fiscal_number
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  test(`GIVEN a valid user decoded from JWT
        WHEN something goes wrong
        THEN the response is 500`, async () => {
    const errorStatus = 500;
    getProfileMock.mockResolvedValueOnce(
      E.right({ status: errorStatus, value: { email: "" } })
    );
    const handler = profileHandler(functionsAppClientMock);

    const res = await handler(aValidUser);

    expect(getProfileMock).toHaveBeenCalledTimes(1);
    expect(getProfileMock).toHaveBeenCalledWith({
      fiscal_code: aValidUser.fiscal_number
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
// #endregion
