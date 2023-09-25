import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as jose from "jose";

import { addSeconds, getUnixTime } from "date-fns";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import { MagicLinkPayload } from "./exchange-jwt";

const alg = "ECDH-ES+A256KW";

export const BaseJwePayload = t.intersection([
  MagicLinkPayload,
  t.type({ exp: t.number, iss: NonEmptyString })
]);
export type BaseJwePayload = t.TypeOf<typeof BaseJwePayload>;

/**
 * Take in input a PEM-encoded PKCS#8 key string and
 * returns an Either with an error or a KeyLike object
 */
const errorOrKeyLikeFromString = (
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

export const secondsFromEpoch = (secondsToAdd: number): Second =>
  getUnixTime(addSeconds(new Date(), secondsToAdd)) as Second;

export const getGenerateJWE: GetGenerateJWE = (issuer, jweKey) => (
  payload,
  ttl
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    errorOrKeyLikeFromString(jweKey),
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
        e => E.toError(`Cannot generate JWE. ${e}`)
      )
    ),
    TE.mapLeft(e => E.toError(`Error: ${e}`)),
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

export const validateJweWithKey = (
  token: NonEmptyString,
  jwePrivateKey: NonEmptyString,
  issuer: NonEmptyString
): TE.TaskEither<Error, BaseJwePayload> =>
  pipe(
    errorOrKeyLikeFromString(jwePrivateKey),
    TE.chain(pkcs8 =>
      TE.tryCatch(() => jose.jwtDecrypt(token, pkcs8, { issuer }), E.toError)
    ),
    TE.mapLeft(e => new Error(`Error decrypting Magic Link JWE: ${e}`)),
    TE.chain(
      flow(
        jwe => jwe.payload,
        BaseJwePayload.decode,
        E.mapLeft(
          err =>
            new Error(`Invalid JWE payload: ${readableReportSimplified(err)}`)
        ),
        TE.fromEither
      )
    )
  );

export const getValidateJWE: GetValidateJWE = (issuer, jwePrivateKey) => (
  token
): TE.TaskEither<Error, BaseJwePayload> =>
  validateJweWithKey(token, jwePrivateKey, issuer);
