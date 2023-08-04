/* eslint-disable @typescript-eslint/explicit-function-return-type */

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

import { LockSessionData } from "../generated/definitions/external/LockSessionData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import { isMockedApi } from "../utils/mockapi_utils";

type ILockSessionHandler = (
  payload: LockSessionData
) => Promise<IResponseSuccessJson<LockSessionData> | IResponseErrorInternal>;

export const LockSessionHandler = (): ILockSessionHandler => (
  payload
): Promise<IResponseSuccessJson<LockSessionData> | IResponseErrorInternal> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      if (payload.unlock_code === "123456789") {
        resolve(ResponseSuccessJson<LockSessionData>(payload));
      } else {
        resolve(ResponseErrorInternal("LockSession failed"));
      }
    }
  });

export const lockSession = (config: IConfig): express.RequestHandler => {
  const handler = LockSessionHandler();
  const middlewaresWrap = withRequestMiddlewares(
    RequiredBodyPayloadMiddleware(LockSessionData),
    verifyUserEligibilityMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
