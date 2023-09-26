import * as express from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { defaultLog } from "@pagopa/winston-ts";

import { IConfig } from "../utils/config";

import { ExchangeToken } from "../generated/definitions/external/ExchangeToken";
import {
  MagicLinkPayload,
  getGenerateExchangeJWT
} from "../utils/exchange-jwt";
import { magicLinkJweValidationMiddleware } from "../utils/middlewares/magic-link-jwe-validation-middleware";

type ExchangeHandlerT = (
  user: MagicLinkPayload
) => Promise<IResponseErrorInternal | IResponseSuccessJson<ExchangeToken>>;

const EXCHANGE_TOKEN_TYPE = "exchange" as NonEmptyString;

export const exchangeHandler = (config: IConfig): ExchangeHandlerT => (
  user_data: MagicLinkPayload
): ReturnType<ExchangeHandlerT> =>
  pipe(
    user_data,
    MagicLinkPayload.decode,
    E.mapLeft(e =>
      ResponseErrorInternal(
        `Invalid Magic Link JWE: ${readableReportSimplified(e)}`
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
    magicLinkJweValidationMiddleware(
      config.BEARER_AUTH_HEADER,
      config.MAGIC_LINK_JWE_ISSUER,
      config.MAGIC_LINK_JWE_PRIVATE_KEY
    )
  );

  return wrapRequestHandler(middlewaresWrap((_, user) => handler(user)));
};
