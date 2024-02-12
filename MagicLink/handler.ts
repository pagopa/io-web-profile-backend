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

import { ContainerClient } from "@azure/storage-blob";
import * as O from "fp-ts/Option";
import { hashFiscalCode } from "@pagopa/ts-commons/lib/hash";
import { fromNullable } from "fp-ts/Option";
import { MagicLinkData } from "../generated/definitions/internal/MagicLinkData";
import { MagicLinkToken } from "../generated/definitions/internal/MagicLinkToken";
import { getGenerateJWE, validateJweWithKey } from "../utils/jwe";
import { storeAuditLog } from "../utils/audit-log";
import { OperationTypes } from "../utils/enums/OperationTypes";

type MagicLinkErrorResponsesT = IResponseErrorInternal;

type MagicLinkHandlerT = (
  payload: MagicLinkData
) => Promise<IResponseSuccessJson<MagicLinkToken> | MagicLinkErrorResponsesT>;

export const magicLinkHandler = (
  issuer: NonEmptyString,
  privateKey: NonEmptyString,
  publicKey: NonEmptyString,
  ttl: number,
  magicLinkBaseUrl: NonEmptyString,
  containerClient: ContainerClient
  // eslint-disable-next-line max-params
): MagicLinkHandlerT => (reqPayload): ReturnType<MagicLinkHandlerT> =>
  pipe(
    getGenerateJWE(issuer, publicKey)(reqPayload, ttl as Second),
    TE.mapLeft(e =>
      ResponseErrorInternal(
        `Something gone wrong generating magic link JWE: ${e}`
      )
    ),
    TE.chain(jwe =>
      pipe(
        validateJweWithKey(jwe, privateKey, issuer),
        TE.chain(decodedJwe =>
          storeAuditLog(
            containerClient,
            {
              ip: O.getOrElse(() => "UNKNOWN")(fromNullable(reqPayload.ip))
            },
            {
              DateTime: new Date(decodedJwe.iat * 1000).toISOString(),
              FiscalCode: hashFiscalCode(reqPayload.fiscal_number),
              IDToken: decodedJwe.jti,
              Type: OperationTypes.ISSUING
            }
          )
        ),
        TE.mapLeft(err =>
          ResponseErrorInternal(
            `Cannot store audit log | ERROR= ${err.message}`
          )
        ),
        TE.map(_ =>
          ResponseSuccessJson({
            // safe cast because the variables referenced are both non-empty strings
            magic_link: `${magicLinkBaseUrl}#token=${jwe}` as NonEmptyString
          })
        )
      )
    ),
    TE.toUnion
  )();

export const getMagicLinkHandler = (
  issuer: NonEmptyString,
  privateKey: NonEmptyString,
  publicKey: NonEmptyString,
  ttl: number,
  magicLinkBaseUrl: NonEmptyString,
  containerClient: ContainerClient
  // eslint-disable-next-line max-params
): express.RequestHandler => {
  const handler = magicLinkHandler(
    issuer,
    privateKey,
    publicKey,
    ttl,
    magicLinkBaseUrl,
    containerClient
  );
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(MagicLinkData)
  );

  return wrapRequestHandler(middlewaresWrap((_, payload) => handler(payload)));
};
