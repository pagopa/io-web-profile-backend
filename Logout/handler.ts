/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseSuccessNoContent
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { verifyJWTMiddleware } from "../utils/auth-jwt";
import { JWTConfig } from "../utils/config";
import { isMockedApi } from "../utils/mockapi_utils";

type ILogoutHandler = () => Promise<
  IResponseSuccessNoContent | IResponseErrorInternal
>;

export const LogoutHandler = (): ILogoutHandler => (): Promise<
  IResponseSuccessNoContent | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      resolve(ResponseSuccessNoContent());
    }
  });

export const logoutSession = (jwtConfig: JWTConfig): express.RequestHandler => {
  const handler = LogoutHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
