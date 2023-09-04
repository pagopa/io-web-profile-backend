import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { IHslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { profileHandler } from "../handler";
import { Client } from "../../generated/definitions/io-functions-app/client";

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

const aValidUser: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L2
};
// #endregion

// #region tests
describe("Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 200 and contains the email`, async () => {
    const handler = profileHandler(functionsAppClientMock);

    const res = await handler(aValidUser);

    expect(getProfileMock).toHaveBeenCalledTimes(1);
    expect(getProfileMock).toHaveBeenCalledWith({
      fiscal_code: aValidUser.fiscal_number
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aValidEmailResponse
    });
  });

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
