import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "../../generated/definitions/fast-login/FiscalCode";
import { Client } from "../../generated/definitions/fast-login/client";
import { SpidLevel } from "../../utils/enums/SpidLevels";
import { IHslJwtPayloadExtended } from "../../utils/middlewares/hsl-jwt-validation-middleware";
import { sessionStateHandler } from "../handler";

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

const aValidUser: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L2
};

const aNotValidUser: IHslJwtPayloadExtended = {
  family_name: "family_name",
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name",
  spid_level: SpidLevel.L1
};
// #endregion

// #region tests
describe("SessionState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid user decoded from JWT
        WHEN all checks passed
        THEN the response is 200`, async () => {
    const handler = sessionStateHandler(sessionStateClientMock);

    const res = await handler(aValidUser);

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
  });

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
});
// #endregion
