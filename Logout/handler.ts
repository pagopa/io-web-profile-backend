import * as express from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { SequenceMiddleware } from "@pagopa/ts-commons/lib/sequence_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorBadGateway,
  IResponseErrorGatewayTimeout,
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseErrorBadGateway,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorGatewayTimeout,
  ResponseErrorInternal,
  ResponseSuccessNoContent
} from "@pagopa/ts-commons/lib/responses";
import { defaultLog } from "@pagopa/winston-ts";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import {
  HslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";
import {
  ExchangeJwtPayloadExtended,
  exchangeJwtValidationMiddleware
} from "../utils/middlewares/exchange-jwt-validation-middleware";

import { Client } from "../generated/definitions/fast-login/client";

type LogoutErrorResponsesT =
  | IResponseErrorInternal
  | IResponseErrorBadGateway
  | IResponseErrorGatewayTimeout;
type LogoutHandlerT = (
  user: HslJwtPayloadExtended | ExchangeJwtPayloadExtended
) => Promise<IResponseSuccessNoContent | LogoutErrorResponsesT>;

type LogoutClient = Client<"ApiKeyAuth">;

export const logoutHandler = (client: LogoutClient): LogoutHandlerT => (
  user_data: HslJwtPayloadExtended | ExchangeJwtPayloadExtended
): ReturnType<LogoutHandlerT> =>
  pipe(
    TE.tryCatch(
      () =>
        client.logoutFromIOApp({
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
    ),
    TE.chain(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        defaultLog.taskEither.errorLeft(e => `${e.detail}`),
        TE.chainW(({ status }) => {
          switch (status) {
            case 204:
              return TE.right(ResponseSuccessNoContent());
            case 502:
              return TE.left<LogoutErrorResponsesT, IResponseSuccessNoContent>(
                ResponseErrorBadGateway(`Something gone wrong.`)
              );
            case 504:
              return TE.left<LogoutErrorResponsesT, IResponseSuccessNoContent>(
                ResponseErrorGatewayTimeout(
                  `Server couldn't respond in time, try again.`
                )
              );
            default:
              return TE.left(
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

export const getLogoutHandler = (
  client: LogoutClient,
  config: IConfig
): express.RequestHandler => {
  const handler = logoutHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    verifyUserEligibilityMiddleware(config),
    SequenceMiddleware(ResponseErrorForbiddenNotAuthorized)(
      hslJwtValidationMiddleware(config),
      exchangeJwtValidationMiddleware(config)
    )
  );

  return wrapRequestHandler(middlewaresWrap((_, __, user) => handler(user)));
};
