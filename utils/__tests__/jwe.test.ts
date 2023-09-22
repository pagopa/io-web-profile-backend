import * as E from "fp-ts/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

import { getGenerateJWE } from "../jwe";
import { exportPKCS8, generateKeyPair } from "jose";

describe(`getGenerateJWE`, () => {
  it("should return a valid JWE", async () => {
    const jweKeys = await generateKeyPair("ECDH-ES+A256KW");
    const formattedKey = (await exportPKCS8(
      jweKeys.privateKey
    )) as NonEmptyString;

    const issuer = "pagopa" as NonEmptyString;
    const ttl = 900 as Second;

    const aValidPayload = {
      family_name: "fn",
      fiscal_number: "fc",
      name: "n"
    };

    const result = await getGenerateJWE(issuer, formattedKey)(
      aValidPayload,
      ttl
    )();

    expect(result).toMatchObject(
      E.right(expect.stringMatching(`[A-Za-z0-9-_]{1,520}`))
    );
  });
});
