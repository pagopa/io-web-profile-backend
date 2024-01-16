import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { config as mockedConfig } from "../../__mocks__/config.mock";
import { MagicLinkPayload } from "../../utils/exchange-jwt";
import { exchangeHandler } from "../handler";
import { Context } from "@azure/functions";
import * as auditLog from "../../utils/audit-log";
import { BlockBlobUploadResponse, RestError } from "@azure/storage-blob";
import * as TE from "fp-ts/TaskEither";

// #region mocks
const aValidUser: MagicLinkPayload = {
  family_name: "family_name" as NonEmptyString,
  fiscal_number: "ISPXNB32R82Y766D" as FiscalCode,
  name: "name" as NonEmptyString,
  jti: "AAAA" as NonEmptyString,
};
// #endregion
let context: Context;

beforeEach(() => {
  context = { log: jest.fn() } as unknown as Context;
});

// #region tests
describe("Exchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test(`GIVEN a valid magic_link JWT
        WHEN all checks passed
        THEN the response is 200 and contains the exchange JWT`, async () => {
    const mockAuditLog = jest
      .spyOn(auditLog, "storeAuditLog")
      .mockReturnValueOnce(TE.right({} as BlockBlobUploadResponse));

    const handler = exchangeHandler(mockedConfig);
    const response = await handler(aValidUser, context);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      kind: "IResponseSuccessJson",
      value: { jwt: expect.stringMatching(`[A-Za-z0-9-_]{1,520}`) },
    });
  });

  test(`GIVEN a valid magic_link JWT
        WHEN auditlog saving data failed
        THEN the response is 500`, async () => {
    const mockAuditLog = jest
      .spyOn(auditLog, "storeAuditLog")
      .mockReturnValueOnce(TE.left("" as unknown as RestError));

    const handler = exchangeHandler(mockedConfig);
    const response = await handler(aValidUser, context);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});
// #endregion
