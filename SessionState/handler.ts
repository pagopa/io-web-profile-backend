import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorBadGateway,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorGatewayTimeout,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorBadGateway,
  ResponseErrorGatewayTimeout,
  ResponseErrorInternal,
  ResponseSuccessJson,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import { defaultLog } from "@pagopa/winston-ts";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import { SessionState } from "../generated/definitions/external/SessionState";
import { Client } from "../generated/definitions/fast-login/client";
import { SpidLevel, gte } from "../utils/enums/SpidLevels";
import {
  HslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";

type SessionStateErrorResponsesT =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorBadGateway
  | IResponseErrorGatewayTimeout;

type SessionStateHandlerT = (
  user: HslJwtPayloadExtended
) => Promise<IResponseSuccessJson<SessionState> | SessionStateErrorResponsesT>;

type SessionStateClient = Client<"ApiKeyAuth">;

const canSeeProfile = (user: HslJwtPayloadExtended): boolean =>
  HslJwtPayloadExtended.is(user) && gte(user.spid_level, SpidLevel.L2);

export const sessionStateHandler = (
  client: SessionStateClient
): SessionStateHandlerT => (
  reqJwtPayload: HslJwtPayloadExtended
): ReturnType<SessionStateHandlerT> =>
  pipe(
    reqJwtPayload,
    TE.fromPredicate(
      user_data => canSeeProfile(user_data),
      user_data =>
        getResponseErrorForbiddenNotAuthorized(
          `Could not perform session-state. Required SpidLevel at least: {${SpidLevel.L2}}; User SpidLevel: {${user_data.spid_level}}`
        )
    ),
    defaultLog.taskEither.errorLeft(errorResponse => `${errorResponse.detail}`),
    TE.chainW(user_data =>
      TE.tryCatch(
        () =>
          client.getUserSessionState({
            body: {
              fiscal_code: user_data.fiscal_number
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
    TE.chain(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        defaultLog.taskEither.errorLeft(e => `${e.detail}`),
        TE.chain(({ status, value }) => {
          switch (status) {
            case 200: {
              return TE.right(ResponseSuccessJson(value));
            }
            case 502:
              return TE.left<
                SessionStateErrorResponsesT,
                IResponseSuccessJson<SessionState>
              >(ResponseErrorBadGateway(`Something gone wrong.`));
            case 504:
              return TE.left<
                SessionStateErrorResponsesT,
                IResponseSuccessJson<SessionState>
              >(
                ResponseErrorGatewayTimeout(
                  `Server couldn't respond in time, try again.`
                )
              );
            default:
              return TE.left<
                SessionStateErrorResponsesT,
                IResponseSuccessJson<SessionState>
              >(
                ResponseErrorInternal(
                  `Something gone wrong. Response Status: {${status}}`
                )
              );
          }
        })
      )
    ),
    TE.toUnion
  )();

export const getSessionStateHandler = (
  client: SessionStateClient,
  config: IConfig
): express.RequestHandler => {
  const handler = sessionStateHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    verifyUserEligibilityMiddleware(config),
    hslJwtValidationMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap((_, __, user) => handler(user)));
};
