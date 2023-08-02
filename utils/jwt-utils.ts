/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jwt from "jsonwebtoken";
import { ulid } from "ulid";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import { Second } from "@pagopa/ts-commons/lib/units";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { isUserElegible } from "./userElegible";
import { AuthJWT } from "./auth-jwt";

// --------------------

const alg = "RS256";

// -----------------------
// Public methods
// -----------------------

/**
 * JWT Generation
 */
export type GetGenerateJWT = <T extends Record<string, unknown>>(
  issuer: NonEmptyString,
  primaryPrivateKey: NonEmptyString
) => (payload: T, ttl: Second) => TE.TaskEither<Error, NonEmptyString>;

export const getGenerateJWT: GetGenerateJWT = (issuer, primaryPrivateKey) => (
  payload,
  ttl
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    TE.taskify<Error, string>(cb =>
      jwt.sign(
        payload,
        primaryPrivateKey,
        {
          algorithm: alg,
          expiresIn: `${ttl} seconds`,
          issuer,
          jwtid: ulid()
        },
        cb
      )
    )(),
    TE.mapLeft(E.toError),
    TE.chain(
      TE.fromPredicate(NonEmptyString.is, () => E.toError("Token is empty."))
    )
  );

export const errorIsInvalidSignatureError = (error: Error): boolean =>
  error.message === "JsonWebTokenError - invalid signature";

/**
 * JWT Validation
 */
export type GetValidateJWT = (
  issuer: NonEmptyString,
  primaryPublicKey: NonEmptyString,
  secondaryPublicKey?: NonEmptyString
) => (token: NonEmptyString) => TE.TaskEither<Error, jwt.JwtPayload>;

export const getValidateJWT: GetValidateJWT = (
  issuer,
  primaryPublicKey,
  secondaryPublicKey
) => (token): TE.TaskEither<Error, jwt.JwtPayload> =>
  pipe(
    token,
    validateJWTWithKey(issuer, primaryPublicKey),
    TE.orElse(err =>
      pipe(
        secondaryPublicKey,
        O.fromNullable,
        O.chain(O.fromPredicate(() => errorIsInvalidSignatureError(err))),
        O.map(key => validateJWTWithKey(issuer, key)(token)),
        O.getOrElse(() => TE.left(err))
      )
    )
  );

export type GetValidateSpidJWT = (
  token: NonEmptyString
) => TE.TaskEither<Error, jwt.JwtPayload>;

// -----------------------
// Private methods
// -----------------------
export const validateJWTWithKey: (
  issuer: NonEmptyString,
  key: NonEmptyString
) => (token: NonEmptyString) => TE.TaskEither<Error, jwt.JwtPayload> = (
  issuer,
  key
) => (token): TE.TaskEither<Error, jwt.JwtPayload> =>
  pipe(
    TE.tryCatch(
      () =>
        new Promise<jwt.JwtPayload>((resolve, reject) => {
          jwt.verify(
            token,
            key,
            { algorithms: [alg], issuer },
            (err, decoded) => {
              if (err) {
                reject(new Error(`${err.name} - ${err.message}`));
              } else if (!decoded) {
                reject("Unable to decode token");
              } else {
                resolve(decoded as jwt.JwtPayload);
              }
            }
          );
        }),
      E.toError
    )
  );

export const getValidateSpidJWT: GetValidateSpidJWT = (
  token
): TE.TaskEither<Error, jwt.JwtPayload> => pipe(token, validateSpidJWT);

export const checkTokenType = (
  token: NonEmptyString
): TE.TaskEither<Error, AuthJWT> =>
  pipe(
    TE.tryCatch(
      () =>
        new Promise<AuthJWT>(resolve => {
          const jwtDecoded = jwt.decode(token) as jwt.JwtPayload;
          if (jwtDecoded?.token_type) {
            resolve(jwtDecoded as AuthJWT);
            return jwtDecoded;
          } else {
            throw new Error("A");
          }
        }),
      E.toError
    )
  );

export const validateSpidJWT = (
  token: NonEmptyString
): TE.TaskEither<Error, AuthJWT> =>
  pipe(
    TE.tryCatch(
      () =>
        new Promise<AuthJWT>((resolve, reject) => {
          const jwtDecoded = jwt.decode(token) as jwt.JwtPayload;
          if (isUserElegible(jwtDecoded.fiscal_number)) {
            resolve(jwtDecoded as AuthJWT);
          } else {
            reject("Error");
          }
        }),
      E.toError
    )
  );
