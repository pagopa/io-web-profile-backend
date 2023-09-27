import { magicLinkHandler } from "../handler";

import { config } from "../../__mocks__/config.mock";

// TODO: jest has some problems with Uint8Array, making the test fail
describe("MagicLink", () => {
  it(`should generate a valid magic link token`, async () => {
    const aValidPayload = {
      family_name: "Rossi",
      fiscal_number: "ISPXNB32R82Y766D",
      name: "Carla"
    };
    const handler = magicLinkHandler(
      config.MAGIC_LINK_JWE_ISSUER,
      config.MAGIC_LINK_JWE_PRIVATE_KEY,
      config.MAGIC_LINK_JWE_TTL,
      config.MAGIC_LINK_BASE_URL
    );
    const res = await handler(aValidPayload);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        magic_link: expect.stringMatching(
          `${config.MAGIC_LINK_BASE_URL}#token=[A-Za-z0-9-_]{1,520}`
        )
      }
    });
  });
});
