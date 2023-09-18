import * as E from "fp-ts/Either";


import {
    ExchangeJWT,
    getGenerateExchangeJWT
} from "../exchange-jwt";


import { config as mockedConfig } from "../../__mocks__/config.mock";


const aPayload = {
  family_name: "fn",
  fiscal_number: "fc",
  name: "name",
  token_type: "exchange"
} as ExchangeJWT;


describe("getGenerateJWT", () => {
  it("should generate a valid ExchangeJWT", async () => {
    const generateJWT = getGenerateExchangeJWT(mockedConfig);

    const res = await generateJWT(aPayload)();

    expect(res).toMatchObject(
      E.right(expect.stringMatching(`[A-Za-z0-9-_]{1,520}`))
    );
  });
});