import * as E from "fp-ts/Either";
import * as J from "fp-ts/Json";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as jose from "jose";

import { addSeconds } from "date-fns";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import { MagicLinkPayload } from "./exchange-jwt";

const alg = "ECDH-ES+A256KW";

export const BaseJwePayload = t.intersection([
  MagicLinkPayload,
  t.type({ exp: t.number, iss: NonEmptyString })
]);
export type BaseJwePayload = t.TypeOf<typeof BaseJwePayload>;

const getKeyLikeFromString = (
  key: NonEmptyString
): TE.TaskEither<Error, jose.KeyLike> =>
  TE.tryCatch(
    () => jose.importPKCS8(key, alg),
    e => E.toError(`Cannot import key. Error: ${e}`)
  );

/**
 * JWE Generation
 */
export type GetGenerateJWE = <T extends jose.JWTPayload>(
  issuer: NonEmptyString,
  jweKey: NonEmptyString
) => (payload: T, ttl: Second) => TE.TaskEither<Error, NonEmptyString>;

const secondsFromEpoch = (secondsToAdd: number): Second => {
  const newDate = addSeconds(new Date(), secondsToAdd);
  return Math.floor(newDate.getTime() / 1000) as Second;
};

export const getGenerateJWE: GetGenerateJWE = (issuer, jweKey) => (
  payload,
  ttl
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    getKeyLikeFromString(jweKey),
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
    TE.chain(
      TE.fromPredicate(NonEmptyString.is, () => E.toError("Token is empty."))
    )
  );

/**
 * JWE Validation
 */
type GetValidateJWE = (
  issuer: NonEmptyString,
  jwePrivateKey: NonEmptyString
) => (token: NonEmptyString) => TE.TaskEither<Error, BaseJwePayload>;

const getPayloadFromDecryptResult = (
  cryptedPayload: jose.CompactDecryptResult
): TE.TaskEither<Error, BaseJwePayload> =>
  pipe(
    E.tryCatch(
      () => new TextDecoder().decode(cryptedPayload.plaintext),
      E.toError
    ),
    E.chain(J.parse),
    E.chainW(BaseJwePayload.decode),
    TE.fromEither,
    TE.mapLeft(_ => E.toError(`Could not decode JWE`))
  );

const validateIssAndExp = (
  payload: BaseJwePayload,
  issuer: NonEmptyString
): TE.TaskEither<Error, BaseJwePayload> =>
  pipe(
    payload,
    TE.fromPredicate(
      x => issuer === x.iss,
      () => new Error("Issuer does not match")
    ),
    TE.chain(
      TE.fromPredicate(
        x => x.exp > Math.floor(Date.now() / 1000),
        () => new Error("Token expired")
      )
    )
  );

export const validateJweWithKey = (
  token: NonEmptyString,
  jwePrivateKey: NonEmptyString,
  issuer: NonEmptyString
): TE.TaskEither<Error, BaseJwePayload> =>
  pipe(
    getKeyLikeFromString(jwePrivateKey),
    TE.chain(pkcs8 =>
      TE.tryCatch(() => jose.compactDecrypt(token, pkcs8), E.toError)
    ),
    TE.mapLeft(e => new Error(`Error decrypting Magic Link JWE: ${e}`)),
    TE.chain(crypted => getPayloadFromDecryptResult(crypted)),
    TE.chain(payload => validateIssAndExp(payload, issuer))
  );

export const getValidateJWE: GetValidateJWE = (issuer, jwePrivateKey) => (
  token
): TE.TaskEither<Error, BaseJwePayload> =>
  validateJweWithKey(token, jwePrivateKey, issuer);
