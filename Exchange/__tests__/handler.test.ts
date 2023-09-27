import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { config as mockedConfig } from "../../__mocks__/config.mock";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { TokenTypes } from "../../utils/enums/TokenTypes";
import { MagicLinkPayload } from "../../utils/exchange-jwt";
import { ExchangeJwtPayloadExtended } from "../../utils/middlewares/exchange-jwt-validation-middleware";
import { exchangeHandler } from "../handler";

// #region mocks
const aValidUser: MagicLinkPayload = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString
};

const aValidExchangeUser: ExchangeJwtPayloadExtended = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  token_type: TokenTypes.EXCHANGE
};
// #endregion

// #region tests
describe("Exchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid magic_link JWT
        WHEN all checks passed
        THEN the response is 200 and contains the exchange JWT`, async () => {
    const handler = exchangeHandler(mockedConfig);

    const response = await handler(aValidUser);

    expect(response).toMatchObject({
      kind: "IResponseSuccessJson",
      value: { jwt: expect.stringMatching(`[A-Za-z0-9-_]{1,520}`) }
    });
  });
});
// #endregion
