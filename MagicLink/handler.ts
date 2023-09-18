import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import * as TE from "fp-ts/TaskEither";

import { pipe } from "fp-ts/lib/function";

import { Second } from "@pagopa/ts-commons/lib/units";
import { MagicLinkData } from "../generated/definitions/internal/MagicLinkData";
import { MagicLinkToken } from "../generated/definitions/internal/MagicLinkToken";

import { IConfig } from "../utils/config";
import { getGenerateJWE } from "../utils/jwe";

type MagicLinkErrorResponsesT = IResponseErrorGeneric | IResponseErrorInternal;

type MagicLinkHandlerT = (
  payload: MagicLinkData
) => Promise<IResponseSuccessJson<MagicLinkToken> | MagicLinkErrorResponsesT>;

export const magicLinkHandler = (config: IConfig): MagicLinkHandlerT => (
  reqPayload
): ReturnType<MagicLinkHandlerT> =>
  pipe(
    getGenerateJWE(
      config.MAGIC_LINK_JWE_ISSUER,
      config.MAGIC_LINK_JWE_PRIVATE_KEY
    )(reqPayload, config.MAGIC_LINK_JWE_TTL as Second),
    TE.mapLeft(e =>
      ResponseErrorInternal(
        `Something gone wrong generating magic link JWE: ${e}`
      )
    ),
    TE.map(jwe =>
      ResponseSuccessJson({
        magic_link_token: jwe
      })
    ),
    TE.toUnion
  )();

export const getMagicLinkHandler = (
  config: IConfig
): express.RequestHandler => {
  const handler = magicLinkHandler(config);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(MagicLinkData)
  );

  return wrapRequestHandler(middlewaresWrap((_, payload) => handler(payload)));
};
