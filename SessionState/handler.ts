/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { verifyJWTMiddleware } from "../utils/auth-jwt";
import { JWTConfig } from "../utils/config";
import { MOCK_RESPONSES, isMockedApi } from "../utils/mockapi_utils";
import { SessionState } from "../generated/definitions/external/SessionState";

type InfoHandler = () => Promise<
  IResponseSuccessJson<SessionState> | IResponseErrorInternal
>;

export const SessionStateHandler = (): InfoHandler => (): Promise<
  IResponseSuccessJson<SessionState> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      resolve(ResponseSuccessJson<SessionState>(MOCK_RESPONSES.sessionState));
    }
  });

export const getSessionState = (
  jwtConfig: JWTConfig
): express.RequestHandler => {
  const handler = SessionStateHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
