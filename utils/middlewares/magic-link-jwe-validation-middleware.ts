import * as E from "fp-ts/Either";

import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import {
  IResponseErrorForbiddenNotAuthorized,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { AuthBearer } from "../../generated/definitions/external/AuthBearer";
import { IConfig } from "../config";
import { BaseJwePayload, getValidateJWE } from "../jwe";

export const magicLinkJweValidation = (config: IConfig) => (
  token: NonEmptyString
): TE.TaskEither<IResponseErrorForbiddenNotAuthorized, BaseJwePayload> =>
  pipe(
    getValidateJWE(
      config.MAGIC_LINK_JWE_ISSUER,
      config.MAGIC_LINK_JWE_PRIVATE_KEY
    )(token),
    TE.mapLeft(error => getResponseErrorForbiddenNotAuthorized(error.message))
  );

export const magicLinkJweValidationMiddleware = (
  config: IConfig
): IRequestMiddleware<
  "IResponseErrorForbiddenNotAuthorized",
  BaseJwePayload
> => (
  req
): Promise<E.Either<IResponseErrorForbiddenNotAuthorized, BaseJwePayload>> =>
  pipe(
    req.headers[config.BEARER_AUTH_HEADER],
    AuthBearer.decode,
    E.mapLeft(_ =>
      getResponseErrorForbiddenNotAuthorized(
        `Invalid or missing JWE in header ${config.BEARER_AUTH_HEADER}`
      )
    ),
    E.map(authBearer => authBearer.replace("Bearer ", "") as NonEmptyString),
    TE.fromEither,
    TE.chain(token => magicLinkJweValidation(config)(token))
  )();
