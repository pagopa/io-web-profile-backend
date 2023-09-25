import * as crypto from "crypto";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as jose from "jose";

import { addSeconds, getUnixTime } from "date-fns";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import { MagicLinkPayload } from "./exchange-jwt";

export const BaseJwePayload = t.intersection([
  MagicLinkPayload,
  t.type({ exp: t.number, iss: NonEmptyString })
]);
export type BaseJwePayload = t.TypeOf<typeof BaseJwePayload>;

/**
 * JWE Generation
 */
export type GetGenerateJWE = <T extends jose.JWTPayload>(
  issuer: NonEmptyString,
  primaryPrivateKey: NonEmptyString
) => (payload: T, ttl: Second) => TE.TaskEither<Error, NonEmptyString>;

export const secondsFromEpoch = (secondsToAdd: number): Second =>
  getUnixTime(addSeconds(new Date(), secondsToAdd)) as Second;

export const getGenerateJWE: GetGenerateJWE = (issuer, primaryPrivateKey) => (
  payload,
  ttl
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    TE.of(crypto.createPrivateKey(primaryPrivateKey)),
    TE.chain(ecPrivateKey =>
      TE.tryCatch(
        () =>
          new jose.EncryptJWT(payload)
            .setProtectedHeader({
              alg: "ECDH-ES+A256KW",
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
  primaryPrivateKey: NonEmptyString,
  secondaryPrivateKey?: NonEmptyString
) => (token: NonEmptyString) => TE.TaskEither<Error, BaseJwePayload>;

export const validateJweWithKey = (
  token: NonEmptyString,
  privateKey: NonEmptyString,
  issuer: NonEmptyString
): TE.TaskEither<Error, BaseJwePayload> =>
  pipe(
    TE.of(crypto.createPrivateKey(privateKey)),
    TE.chain(key =>
      TE.tryCatch(() => jose.jwtDecrypt(token, key, { issuer }), E.toError)
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

export const errorIsInvalidSignatureError = (error: Error): boolean =>
  error.message.includes(`Error decrypting Magic Link JWE`);

export const getValidateJWE: GetValidateJWE = (
  issuer,
  primaryPrivateKey,
  secondaryPrivateKey
) => (token): TE.TaskEither<Error, BaseJwePayload> =>
  pipe(
    validateJweWithKey(token, primaryPrivateKey, issuer),
    TE.orElse(err =>
      pipe(
        secondaryPrivateKey,
        O.fromNullable,
        O.chain(O.fromPredicate(() => errorIsInvalidSignatureError(err))),
        O.map(key => validateJweWithKey(token, key, issuer)),
        O.getOrElse(() => TE.left(err))
      )
    )
  );
