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
import { BaseJwePayload, getValidateJWE } from "../jwe";

export const magicLinkJweValidation = (
  issuer: NonEmptyString,
  privateKey: NonEmptyString
) => (
  token: NonEmptyString
): TE.TaskEither<IResponseErrorForbiddenNotAuthorized, BaseJwePayload> =>
  pipe(
    getValidateJWE(issuer, privateKey)(token),
    TE.mapLeft(error => getResponseErrorForbiddenNotAuthorized(error.message))
  );

export const magicLinkJweValidationMiddleware = (
  authHeader: NonEmptyString,
  issuer: NonEmptyString,
  privateKey: NonEmptyString
): IRequestMiddleware<
  "IResponseErrorForbiddenNotAuthorized",
  BaseJwePayload
> => (
  req
): Promise<E.Either<IResponseErrorForbiddenNotAuthorized, BaseJwePayload>> =>
  pipe(
    req.headers[authHeader],
    AuthBearer.decode,
    E.mapLeft(_ =>
      getResponseErrorForbiddenNotAuthorized(
        `Invalid or missing JWE in header ${authHeader}`
      )
    ),
    E.map(authBearer => authBearer.replace("Bearer ", "") as NonEmptyString),
    TE.fromEither,
    TE.chain(token => magicLinkJweValidation(issuer, privateKey)(token))
  )();
