import * as E from "fp-ts/Either";
import { hslJwtValidation } from "../hsl-jwt-validation-middleware";
import { config } from "../../../__mocks__/config.mock";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

describe(`Hub Spid Login JWT Validation Middleware`, () => {
  it(`Should validate JWT and call hub-spid-login for introspection call,
    - Should return JWT payload 
    - Success -`, async () => {
    const token = config.HUB_SPID_LOGIN_MOCK_TOKEN;

    const jwtValidation = hslJwtValidation(token, config);
    const result = await jwtValidation(token)();

    expect(E.isRight(result)).toBe(true);

    const resultPayload = E.fold(
      () => null,
      payload => payload
    )(result);

    expect(resultPayload).toMatchObject({
      name: expect.anything() as string,
      family_name: expect.anything() as string,
      fiscal_number: expect.anything() as FiscalCode
    });
  });
});

describe(`Hub Spid Login JWT Validation Middleware`, () => {
  it(`Should fail if JWT is not valid or expired,
     - Fail -`, async () => {
    const token = "" as NonEmptyString;

    const jwtValidation = hslJwtValidation(token, config);
    const result = await jwtValidation(token)();

    expect(E.isLeft(result)).toBe(true);
  });
});
