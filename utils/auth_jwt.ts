import * as t from "io-ts";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  getResponseErrorForbiddenNotAuthorized,
  IResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";

import { AuthBearer } from "../generated/definitions/external/AuthBearer";
import { JWTConfig } from "./config";
import { getValidateJWT } from "./jwt_with_key_rotation";

/**
 * Type Definitions
 */

export type AuthJWT = t.TypeOf<typeof AuthJWT>;

export const AuthJWT = t.interface({
  fiscal_number: t.string,
  operationId: t.string
});

export type ValidateAuthJWT = (
  token: NonEmptyString
) => TE.TaskEither<Error, AuthJWT>;

export const getValidateAuthJWT = ({
  ISSUER,
  PRIMARY_PUBLIC_KEY,
  SECONDARY_PUBLIC_KEY
}: JWTConfig): ValidateAuthJWT =>
  pipe(
    getValidateJWT(ISSUER, PRIMARY_PUBLIC_KEY, SECONDARY_PUBLIC_KEY),
    validateJWTFunction => (token): ReturnType<ValidateAuthJWT> =>
      pipe(
        validateJWTFunction(token),
        TE.filterOrElse(AuthJWT.is, () => E.toError("Invalid AuthJWT payload"))
      )
  );

export const verifyJWTMiddleware = (
  jwtConfig: JWTConfig
): IRequestMiddleware<"IResponseErrorForbiddenNotAuthorized", AuthJWT> => (
  req
): Promise<E.Either<IResponseErrorForbiddenNotAuthorized, AuthJWT>> =>
  pipe(
    req.headers[jwtConfig.BEARER_AUTH_HEADER],
    AuthBearer.decode,
    E.mapLeft(_ =>
      getResponseErrorForbiddenNotAuthorized(
        `Invalid or missing JWT in header ${jwtConfig.BEARER_AUTH_HEADER}`
      )
    ),
    E.map(authBearer => authBearer.replace("Bearer ", "") as NonEmptyString),
    TE.fromEither,
    TE.chain(token =>
      pipe(
        token,
        getValidateAuthJWT(jwtConfig),
        TE.mapLeft(_ =>
          getResponseErrorForbiddenNotAuthorized("Invalid or expired JWT")
        )
      )
    )
  )();
