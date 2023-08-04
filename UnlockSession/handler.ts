/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { UnlockSessionData } from "../generated/definitions/external/UnlockSessionData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import { isMockedApi } from "../utils/mockapi_utils";

type IUnlockSessionHandler = (
  payload: UnlockSessionData
) => Promise<IResponseSuccessNoContent | IResponseErrorInternal>;

export const UnlockSessionHandler = (): IUnlockSessionHandler => (
  payload
): Promise<IResponseSuccessNoContent | IResponseErrorInternal> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      if (
        payload.unlock_code === "123456789" ||
        payload.unlock_code === undefined
      ) {
        resolve(ResponseSuccessNoContent());
      } else {
        resolve(ResponseErrorInternal("UnlockSession failed"));
      }
    }
  });

export const unlockSession = (config: IConfig): express.RequestHandler => {
  const handler = UnlockSessionHandler();
  const middlewaresWrap = withRequestMiddlewares(
    RequiredBodyPayloadMiddleware(UnlockSessionData),
    verifyUserEligibilityMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
