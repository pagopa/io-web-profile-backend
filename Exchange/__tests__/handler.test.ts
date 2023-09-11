import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { config as mockedConfig } from "../../__mocks__/config.mock";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { TokenTypes } from "../../utils/enums/TokenTypes";
import {
  ExchangeJwtPayloadExtended,
  exchangeJwtValidation
} from "../../utils/middlewares/exchange-jwt-validation-middleware";
import { HslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { exchangeHandler } from "../handler";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

// #region mocks
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

const generateJWTFunction = jest
  .fn()
  .mockImplementation(() => TE.of(aValidExchangeUser));
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
