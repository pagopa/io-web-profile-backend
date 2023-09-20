import * as E from "fp-ts/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

import { getGenerateJWE } from "../jwe";

describe(`getGenerateJWE`, () => {
  it("should return a valid JWE", async () => {
    const jweKey = `-----BEGIN PRIVATE KEY-----
    MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgiyvo0X+VQ0yIrOaN
    nlrnUclopnvuuMfoc8HHly3505OhRANCAAQWUcdZ8uTSAsFuwtNy4KtsKqgeqYxg
    l6kwL5D4N3pEGYGIDjV69Sw0zAt43480WqJv7HCL0mQnyqFmSrxj8jMa
    -----END PRIVATE KEY-----` as NonEmptyString;
    const issuer = "pagopa" as NonEmptyString;
    const ttl = 900 as Second;
    const aValidPayload = {
      family_name: "fn",
      fiscal_number: "fc",
      name: "n"
    };
    const result = await getGenerateJWE(issuer, jweKey)(aValidPayload, ttl)();

    expect(result).toMatchObject(
      E.right(expect.stringMatching(`[A-Za-z0-9-_]{1,520}`))
    );
  });
});
