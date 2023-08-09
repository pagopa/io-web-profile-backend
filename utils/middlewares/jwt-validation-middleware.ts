import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as jwt from "jsonwebtoken";
import { getValidateJWT } from "@pagopa/ts-commons/lib/jwt_with_key_rotation";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  getResponseErrorForbiddenNotAuthorized,
  IResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";

import { AuthBearer } from "../../generated/definitions/external/AuthBearer";
import { IConfig } from "../config";

export type HslJWTValid = (
  token: NonEmptyString
) => TE.TaskEither<Error, jwt.JwtPayload>;

export const jwtValidation = (
  token: NonEmptyString,
  config: IConfig
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
): HslJWTValid => () =>
  pipe(
    getValidateJWT(
      config.HUB_SPID_LOGIN_JWT_ISSUER,
      config.HUB_SPID_LOGIN_JWT_KEY
    )(token),
    TE.mapLeft(error => new Error(error.message)),
    TE.map(tokenPayload => tokenPayload)
  );

export const jwtValidationMiddleware = (
  config: IConfig
): IRequestMiddleware<
  "IResponseErrorForbiddenNotAuthorized",
  jwt.JwtPayload
> => (
  req
): Promise<E.Either<IResponseErrorForbiddenNotAuthorized, jwt.JwtPayload>> =>
  pipe(
    req.headers[config.BEARER_AUTH_HEADER],
    AuthBearer.decode,
    E.mapLeft(_ =>
      getResponseErrorForbiddenNotAuthorized(
        `Invalid or missing JWT in header ${config.BEARER_AUTH_HEADER}`
      )
    ),
    E.map(authBearer => authBearer.replace("Bearer ", "") as NonEmptyString),
    TE.fromEither,
    TE.chain(token =>
      pipe(
        token,
        jwtValidation(token, config),
        TE.mapLeft(error =>
          getResponseErrorForbiddenNotAuthorized(error.message)
        )
      )
    )
  )();
