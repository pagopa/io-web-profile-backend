import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { defaultLog } from "@pagopa/winston-ts";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import { Client } from "../generated/definitions/fast-login/client";
import {
  IHslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";

type ILogoutHandler = (
  user: IHslJwtPayloadExtended
) => Promise<IResponseSuccessJson<void> | IResponseErrorInternal>;

type LogoutClient = Client<"ApiKeyAuth">;

export const logoutHandler = (client: LogoutClient): ILogoutHandler => (
  user_data: IHslJwtPayloadExtended
): ReturnType<ILogoutHandler> =>
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
    TE.chainW(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        defaultLog.taskEither.errorLeft(e => `${e.detail}`),
        TE.chainW(response => {
          if (response.status === 200) {
            return TE.right(ResponseSuccessJson(void 0));
          } else {
            return TE.left<IResponseErrorInternal, IResponseSuccessJson<void>>(
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

export const getLogoutHandler = (
  client: LogoutClient,
  config: IConfig
): express.RequestHandler => {
  const handler = logoutHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    verifyUserEligibilityMiddleware(config),
    hslJwtValidationMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap((_, __, user) => handler(user)));
};
