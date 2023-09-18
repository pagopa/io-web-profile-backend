import * as E from "fp-ts/Either";
import * as jose from "jose";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

import { getGenerateJWE } from "../jwe";

describe(`getGenerateJWE`, () => {
  it("should return a valid JWE", async () => {
    const jwe =
      "eyJhbGciOiJFQ0RILUVTK0EyNTZLVyIsImNydiI6IlAtMjU2IiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImt0eSI6IkVDIiwiZXBrIjp7IngiOiJvYk83YWhGelA5b0xvckhWYjhxRG5oRVZRenpEejZPd2NKbjk0b25MeUhvIiwiY3J2IjoiUC0yNTYiLCJrdHkiOiJFQyIsInkiOiJIV2hWV2RyUF9PLVA2VTZRVGxLY3NtQXVSRW92NDduZ0lVWjJrcXJYVjZFIn19.xzz0VtYGwuyKjfQQ9KfJR0cLKGXPL9D6UHlR5s4YDNsHTsIBCXvzAg.9pu8FSaOvq9xGBSL8zeUzw.-f8zCJHuuXZ6H2wME5RuSk981afu0uqhPuP-JHYZ2jIp_lUht3Mhhx3PTCWR0CwW-sQqpqiz1SlXfr3cGJhy8KMSmCptKCK_e6zpzJJ5KVdBox5BTZTamqY6MbLP417aZW0GXKtAr9dl2ji40hqWThu7d-xTkvMz19ItyBxfedM.DulzGzH0vgqG7N0t6RL7pw";
    const jweKey = `-----BEGIN PRIVATE KEY-----
    MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgiyvo0X+VQ0yIrOaN
    nlrnUclopnvuuMfoc8HHly3505OhRANCAAQWUcdZ8uTSAsFuwtNy4KtsKqgeqYxg
    l6kwL5D4N3pEGYGIDjV69Sw0zAt43480WqJv7HCL0mQnyqFmSrxj8jMa
    -----END PRIVATE KEY-----` as NonEmptyString;

    const pkcs8 = await jose.importPKCS8(jweKey, "ECDH-ES+A256KW");
    const result = await jose.compactDecrypt(jwe, pkcs8);

    const expected =
      '{"name":"Carla","family_name":"Rossi","fiscal_code":"ISPXNB32R82Y766D","iss":"pagopa","iat":1695031301,"exp":1695636101}';
    expect(new TextDecoder().decode(result.plaintext)).toBe(expected);
  });
});
