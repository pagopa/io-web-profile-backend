import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { defaultLog } from "@pagopa/winston-ts";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { SequenceMiddleware } from "@pagopa/ts-commons/lib/sequence_middleware";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessNoContent,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { flow, pipe } from "fp-ts/lib/function";
import { LockSessionData } from "../generated/definitions/external/LockSessionData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import { Client } from "../generated/definitions/fast-login/client";
import { SpidLevel, gte } from "../utils/enums/SpidLevels";
import {
  HslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";
import {
  ExchangeJwtPayloadExtended,
  exchangeJwtValidationMiddleware
} from "../utils/middlewares/exchange-jwt-validation-middleware";

type ILookSessionErrorResponses =
  | IResponseErrorConflict
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal;

type ILockSessionHandler = (
  user: HslJwtPayloadExtended | ExchangeJwtPayloadExtended,
  payload: LockSessionData
) => Promise<IResponseSuccessNoContent | ILookSessionErrorResponses>;

type LockSessionClient = Client<"ApiKeyAuth">;

const canLock = (
  user: HslJwtPayloadExtended | ExchangeJwtPayloadExtended
): boolean =>
  ExchangeJwtPayloadExtended.is(user) || gte(user.spid_level, SpidLevel.L2);

export const lockSessionHandler = (
  client: LockSessionClient
): ILockSessionHandler => (
  reqJwtData,
  reqPayload
): ReturnType<ILockSessionHandler> =>
  pipe(
    TE.Do,
    TE.bind("user_data", () => TE.of(reqJwtData)),
    TE.bind("unlock_code", () => TE.of(reqPayload.unlock_code)),
    TE.chain(
      flow(
        TE.fromPredicate(
          ({ user_data }) => canLock(user_data),
          ({ user_data }) =>
            getResponseErrorForbiddenNotAuthorized(
              `Could not perform lock-session. Required SpidLevel at least: {${
                SpidLevel.L2
              }}; User SpidLevel: {${
                HslJwtPayloadExtended.is(user_data)
                  ? user_data.spid_level
                  : undefined
              }}`
            )
        ),
        defaultLog.taskEither.errorLeft(
          errorResponse => `${errorResponse.detail}`
        )
      )
    ),
    TE.chainW(({ user_data, unlock_code }) =>
      TE.tryCatch(
        () =>
          client.lockUserSession({
            body: {
              fiscal_code: user_data.fiscal_number,
              unlock_code
            }
          }),
        flow(
          E.toError,
          e =>
            ResponseErrorInternal(
              `Something gone wrong calling fast-login: ${e.message}`
            ),
          defaultLog.peek.error(e => `${e.detail}`)
        )
      )
    ),
    TE.chainW(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        defaultLog.taskEither.errorLeft(e => `${e.detail}`),
        TE.chainW(response => {
          switch (response.status) {
            case 204:
              return TE.right(ResponseSuccessNoContent());
            case 409:
              return TE.left<
                ILookSessionErrorResponses,
                IResponseSuccessNoContent
              >(ResponseErrorConflict("Session was already locked"));
            default:
              return TE.left<
                ILookSessionErrorResponses,
                IResponseSuccessNoContent
              >(
                ResponseErrorInternal(
                  `Something gone wrong. Response Status: {${response.status}}`
                )
              );
          }
        })
      )
    ),
    TE.toUnion
  )();

export const getLockSessionHandler = (
  client: LockSessionClient,
  config: IConfig
): express.RequestHandler => {
  const handler = lockSessionHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    verifyUserEligibilityMiddleware(config),
    SequenceMiddleware(ResponseErrorForbiddenNotAuthorized)(
      hslJwtValidationMiddleware(config),
      exchangeJwtValidationMiddleware(config)
    ),
    RequiredBodyPayloadMiddleware(LockSessionData)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, __, user, payload) => handler(user, payload))
  );
};
