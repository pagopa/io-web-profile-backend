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
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { defaultLog } from "@pagopa/winston-ts";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";

import * as express from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import { ExchangeToken } from "../generated/definitions/external/ExchangeToken";
import {
  MagicLinkPayload,
  getGenerateExchangeJWT
} from "../utils/exchange-jwt";
import {
  HslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";

type ExchangeHandlerT = (
  user: HslJwtPayloadExtended
) => Promise<IResponseErrorInternal | IResponseSuccessJson<ExchangeToken>>;

const EXCHANGE_TOKEN_TYPE = "exchange" as NonEmptyString;

export const exchangeHandler = (config: IConfig): ExchangeHandlerT => (
  user_data: HslJwtPayloadExtended
): ReturnType<ExchangeHandlerT> =>
  pipe(
    // TODO: logic on magic link token
    {
      family_name: user_data.family_name,
      fiscal_number: user_data.fiscal_number,
      name: user_data.name,
      spid_level: user_data.spid_level
    },
    MagicLinkPayload.decode,
    E.mapLeft(e =>
      ResponseErrorInternal(
        `Invalid Magic Link JWT: ${readableReportSimplified(e)}`
      )
    ),
    TE.fromEither,
    TE.chain(magic_link_payload =>
      pipe(
        getGenerateExchangeJWT(config)({
          ...magic_link_payload,
          token_type: EXCHANGE_TOKEN_TYPE
        }),
        TE.mapLeft(e =>
          ResponseErrorInternal(
            `Cannot generate Exchange JWT|ERROR=${e.message}`
          )
        ),
        defaultLog.taskEither.errorLeft(
          r => r.detail ?? "Cannot generate Exchange JWT"
        ),
        TE.map(jwt => ResponseSuccessJson({ jwt } as ExchangeToken))
      )
    ),
    TE.toUnion
  )();

export const getExchangeHandler = (config: IConfig): express.RequestHandler => {
  const handler = exchangeHandler(config);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    verifyUserEligibilityMiddleware(config),
    hslJwtValidationMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap((_, __, user) => handler(user)));
};
