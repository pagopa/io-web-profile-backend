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
import * as express from "express";

import * as TE from "fp-ts/TaskEither";

import { pipe } from "fp-ts/lib/function";

import { Second } from "@pagopa/ts-commons/lib/units";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { MagicLinkData } from "../generated/definitions/internal/MagicLinkData";
import { MagicLinkToken } from "../generated/definitions/internal/MagicLinkToken";

import { getGenerateJWE } from "../utils/jwe";

type MagicLinkErrorResponsesT = IResponseErrorInternal;

type MagicLinkHandlerT = (
  payload: MagicLinkData
) => Promise<IResponseSuccessJson<MagicLinkToken> | MagicLinkErrorResponsesT>;

export const magicLinkHandler = (
  issuer: NonEmptyString,
  privateKey: NonEmptyString,
  ttl: NumberFromString,
  magicLinkUrl: NonEmptyString
): MagicLinkHandlerT => (reqPayload): ReturnType<MagicLinkHandlerT> =>
  pipe(
    getGenerateJWE(issuer, privateKey)(reqPayload, ttl as Second),
    TE.mapLeft(e =>
      ResponseErrorInternal(
        `Something gone wrong generating magic link JWE: ${e}`
      )
    ),
    TE.map(jwe =>
      ResponseSuccessJson({
        magic_link: `${magicLinkUrl}${jwe}`
      })
    ),
    TE.toUnion
  )();

export const getMagicLinkHandler = (
  issuer: NonEmptyString,
  privateKey: NonEmptyString,
  ttl: NumberFromString,
  magicLinkUrl: NonEmptyString
): express.RequestHandler => {
  const handler = magicLinkHandler(issuer, privateKey, ttl, magicLinkUrl);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(MagicLinkData)
  );

  return wrapRequestHandler(middlewaresWrap((_, payload) => handler(payload)));
};
