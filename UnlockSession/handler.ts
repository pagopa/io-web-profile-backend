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
import { UnlockSessionData } from "../generated/definitions/external/UnlockSessionData";

type ILockSessionHandler = (
  payload: UnlockSessionData
) => Promise<IResponseSuccessJson<void> | IResponseErrorInternal>;

export const UnlockSessionHandler = (): ILockSessionHandler => (
  payload
): Promise<IResponseSuccessJson<void> | IResponseErrorInternal> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      if (payload.unlock_code === "123456789") {
        resolve(ResponseSuccessJson(void 0));
      } else {
        resolve(ResponseErrorInternal("UnlockSession failed"));
      }
    }
  });

export const unlockSession = (config: IConfig): express.RequestHandler => {
  const handler = UnlockSessionHandler();
  const middlewaresWrap = withRequestMiddlewares(
    RequiredBodyPayloadMiddleware(LockSessionData),
    verifyUserEligibilityMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
