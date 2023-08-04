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

import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import { isMockedApi } from "../utils/mockapi_utils";

type ILogoutHandler = () => Promise<
  IResponseSuccessJson<void> | IResponseErrorInternal
>;

export const LogoutHandler = (): ILogoutHandler => (): Promise<
  IResponseSuccessJson<void> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      resolve(ResponseSuccessJson(void 0));
    }
  });

export const logoutSession = (config: IConfig): express.RequestHandler => {
  const handler = LogoutHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
