import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as jose from "jose";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

/**
 * JWE Generation
 */
export type GetGenerateJWE = <T extends jose.JWTPayload>(
  issuer: NonEmptyString,
  jweKey: NonEmptyString
) => (payload: T, ttl: Second) => TE.TaskEither<Error, NonEmptyString>;

const secondsFromEpoch = (secondsToAdd: number): Second => {
  const date = new Date();
  const today = Math.floor(date.getTime() / 1000);
  const total = today + secondsToAdd;
  return total as Second;
};

const alg = "ECDH-ES+A256KW";
export const getGenerateJWE: GetGenerateJWE = (issuer, jweKey) => (
  payload,
  ttl
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    TE.tryCatch(
      () => jose.importPKCS8(jweKey, alg),
      e => E.toError(`Invalid JWE Key. Error: ${e}`)
    ),
    TE.chain(ecPrivateKey =>
      TE.tryCatch(
        () =>
          new jose.EncryptJWT(payload)
            .setProtectedHeader({
              alg,
              crv: "P-256",
              enc: "A128CBC-HS256",
              kty: "EC"
            })
            .setIssuer(issuer)
            .setIssuedAt()
            .setExpirationTime(secondsFromEpoch(ttl))
            .encrypt(ecPrivateKey),
        e => E.toError(`Cannot generate JWE. Error: ${e}`)
      )
    ),
    TE.mapLeft(e => E.toError(`Error: ${e}`)),
    TE.chain(
      TE.fromPredicate(NonEmptyString.is, () => E.toError("Token is empty."))
    )
  );
