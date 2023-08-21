import * as E from "fp-ts/Either";
import { hslJwtValidation } from "../hsl-jwt-validation-middleware";
import { config } from "../../../__mocks__/config.mock";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

describe(`Hub Spid Login JWT Validation Middleware`, () => {
  it(`Should validate JWT and call hub-spid-login for introspection call,
    - Should return JWT payload 
    - Success -`, async () => {
    const mockIntrospectionCall = jest
      .spyOn(hslUtils, "introspectionCall")
      .mockReturnValueOnce(TE.right(ResponseSuccessJson({ active: true })));
    const token = config.HUB_SPID_LOGIN_MOCK_TOKEN;

    const jwtValidation = hslJwtValidation(token, config);
    const result = await jwtValidation(token)();

    expect(E.isRight(result)).toBe(true);
    expect(mockIntrospectionCall).toHaveBeenCalledTimes(1);
    expect(mockIntrospectionCall).toHaveBeenCalledWith(token, config);

    const resultPayload = E.fold(
      () => null,
      payload => payload
    )(result);

    expect(resultPayload).toMatchObject({
      name: "Carla",
      family_name: "Rossi",
      fiscal_number: "ISPXNB32R82Y766D"
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
