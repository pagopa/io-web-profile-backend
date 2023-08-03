import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as jwt from "jsonwebtoken";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  getResponseErrorForbiddenNotAuthorized,
  IResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";

import { AuthBearer } from "../generated/definitions/external/AuthBearer";
import { IConfig } from "./config";
import { getIsUserElegibleIoWebProfile } from "./userElegible";

/**
 * Type Definitions
 */

export type UserEligibleJWT = () => TE.TaskEither<Error, boolean>;

export const createOptionValue = (
  value: boolean
): E.Either<boolean, boolean> => {
  if (value) {
    return E.right(true);
  } else {
    return E.left(false);
  }
};
export const userIsEligible = (
  token: NonEmptyString,
  config: IConfig
): UserEligibleJWT => {
  const jwtDecoded = jwt.decode(token) as jwt.JwtPayload;
  const isUserEligible = getIsUserElegibleIoWebProfile(
    config.BETA_TESTERS,
    config.FF_API_ENABLED
  )(jwtDecoded.fiscal_code);
  return pipe(
    createOptionValue(isUserEligible),
    TE.mapLeft(() => new Error("User is not eligible"))
  );
};

export const verifyUserEligibilityMiddleware = (
  config: IConfig
): IRequestMiddleware<"IResponseErrorForbiddenNotAuthorized", boolean> => (
  req
): Promise<E.Either<IResponseErrorForbiddenNotAuthorized, boolean>> =>
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
        userIsEligible(token, config),
        TE.mapLeft(_ =>
          getResponseErrorForbiddenNotAuthorized("Invalid or expired JWT")
        )
      )
    )
  )();
