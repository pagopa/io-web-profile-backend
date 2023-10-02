import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
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
import { Second } from "@pagopa/ts-commons/lib/units";

import { MagicLinkData } from "../generated/definitions/internal/MagicLinkData";
import { MagicLinkToken } from "../generated/definitions/internal/MagicLinkToken";
import { getGenerateJWE } from "../utils/jwe";

type MagicLinkErrorResponsesT = IResponseErrorInternal;

type MagicLinkHandlerT = (
  payload: MagicLinkData
) => Promise<IResponseSuccessJson<MagicLinkToken> | MagicLinkErrorResponsesT>;

export const magicLinkHandler = (
  issuer: NonEmptyString,
  publicKey: NonEmptyString,
  ttl: number,
  magicLinkBaseUrl: NonEmptyString
): MagicLinkHandlerT => (reqPayload): ReturnType<MagicLinkHandlerT> =>
  pipe(
    getGenerateJWE(issuer, publicKey)(reqPayload, ttl as Second),
    TE.mapLeft(e =>
      ResponseErrorInternal(
        `Something gone wrong generating magic link JWE: ${e}`
      )
    ),
    TE.map(jwe =>
      ResponseSuccessJson({
        magic_link: `${magicLinkBaseUrl}#token=${jwe}`
      })
    ),
    TE.toUnion
  )();

export const getMagicLinkHandler = (
  issuer: NonEmptyString,
  publicKey: NonEmptyString,
  ttl: number,
  magicLinkBaseUrl: NonEmptyString
): express.RequestHandler => {
  const handler = magicLinkHandler(issuer, publicKey, ttl, magicLinkBaseUrl);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(MagicLinkData)
  );

  return wrapRequestHandler(middlewaresWrap((_, payload) => handler(payload)));
};
