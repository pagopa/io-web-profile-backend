import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as jose from "jose";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

/**
 * JWE Generation
 */
export type GetGenerateJWE = <T extends Record<string, unknown>>(
  issuer: NonEmptyString,
  jweKey: NonEmptyString
) => (payload: T, ttl: Second) => TE.TaskEither<Error, NonEmptyString>;

export const getGenerateJWE: GetGenerateJWE = (issuer, jweKey) => (
  payload,
  ttl
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    TE.tryCatch(
      () => jose.importPKCS8(jweKey, "ECDH-ES+A256KW"),
      e => {
        throw new Error(`Invalid JWE Key. Error: ${e}`);
      }
    ),
    TE.chain(pkcs8 => {
      const plaintext = new TextEncoder().encode(
        JSON.stringify({ ...payload, issuer, ttl })
      );
      console.log("plaintext: ", plaintext);
      return TE.taskify<Error, string>(() =>
        new jose.GeneralEncrypt(plaintext)
          .setProtectedHeader({
            // crv: "P-256",
            enc: "A128CBC-HS256"
            // kty: "EC"
          })
          .addRecipient(pkcs8)
          .setUnprotectedHeader({
            alg: "ECDH-ES+A256KW"
          })
          .encrypt()
      )();
    }),
    x => {
      console.log("====> ", x);
      return x;
    },
    TE.mapLeft(e => E.toError(`Error: ${e}`)),
    TE.chain(
      TE.fromPredicate(NonEmptyString.is, () => E.toError("Token is empty."))
    )
  );
