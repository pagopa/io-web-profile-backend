import { magicLinkHandler } from "../handler";

import { config } from "../../__mocks__/config.mock";

// TODO: jest has some problems with Uint8Array, making the test fail
describe("MagicLink", () => {
  it(`should generate a valid magic link token`, async () => {
    const aValidPayload = {
      family_name: "Rossi",
      fiscal_code: "ISPXNB32R82Y766D",
      name: "Carla"
    };
    const handler = magicLinkHandler(config);
    const res = await handler(aValidPayload);

    expect(res).toMatchObject({
      magic_link_token: expect.stringMatching(`[A-Za-z0-9-_]{1,520}`)
    });
  });
});
