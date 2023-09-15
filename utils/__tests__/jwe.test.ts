import * as E from "fp-ts/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

import { getGenerateJWE } from "../jwe";

describe(`getGenerateJWE`, () => {
  it(
    "should return a valid JWE",
    async () => {
      const issuer = "PAGOPA" as NonEmptyString;
      const jweKey = `-----BEGIN PRIVATE KEY-----
    MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgiyvo0X+VQ0yIrOaN
    nlrnUclopnvuuMfoc8HHly3505OhRANCAAQWUcdZ8uTSAsFuwtNy4KtsKqgeqYxg
    l6kwL5D4N3pEGYGIDjV69Sw0zAt43480WqJv7HCL0mQnyqFmSrxj8jMa
    -----END PRIVATE KEY-----` as NonEmptyString;
      const payload = { field: "test" };

      const result = await getGenerateJWE(issuer, jweKey)(
        payload,
        900 as Second
      )();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBe("");
      }
    },
    700000000
  );
});
