import * as E from "fp-ts/lib/Either";
import { aValidExchangeUser, aValidL2User } from "../../__mocks__/users";
import { Client } from "../../generated/definitions/fast-login/client";
import { logoutHandler } from "../handler";

// #region mocks
const logoutMock = jest.fn(async () =>
  E.right({
    status: 204
  })
);
const fastLoginClientMock = ({
  logoutFromIOApp: logoutMock
} as unknown) as Client<"ApiKeyAuth">;
// #endregion

// #region tests
describe("Logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([aValidL2User, aValidExchangeUser])(
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

    const res = await handler(aValidL2User);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidL2User.fiscal_number
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

    const res = await handler(aValidL2User);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidL2User.fiscal_number
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

    const res = await handler(aValidL2User);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith({
      body: {
        fiscal_code: aValidL2User.fiscal_number
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorGatewayTimeout"
    });
  });
});
// #endregion
