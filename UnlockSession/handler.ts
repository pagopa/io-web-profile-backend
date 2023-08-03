/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { verifyJWTMiddleware } from "../utils/auth-jwt";
import { JWTConfig } from "../utils/config";
import { isMockedApi } from "../utils/mockapi_utils";
import { LockSessionData } from "../generated/definitions/external/LockSessionData";

type ILockSessionHandler = (
  payload: LockSessionData
) => Promise<IResponseSuccessJson<LockSessionData> | IResponseErrorInternal>;

export const UnlockSessionHandler = (): ILockSessionHandler => (
  payload
): Promise<IResponseSuccessJson<LockSessionData> | IResponseErrorInternal> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      if (payload.unlockCode === "123456789") {
        resolve(ResponseSuccessJson<LockSessionData>(payload));
      } else {
        resolve(ResponseErrorInternal("Ciao"));
      }
    }
  });

export const unlockSession = (jwtConfig: JWTConfig): express.RequestHandler => {
  const handler = UnlockSessionHandler();
  const middlewaresWrap = withRequestMiddlewares(
    RequiredBodyPayloadMiddleware(LockSessionData),
    verifyJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
