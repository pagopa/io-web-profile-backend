/* eslint-disable @typescript-eslint/explicit-function-return-type */

import * as express from "express";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { verifyTesterJWTMiddleware } from "../utils/auth_jwt_tester";
import { JWTConfig } from "../utils/config";

import { ServiceStatus } from "../generated/definitions/external/ServiceStatus";

type InfoHandler = () => Promise<
  IResponseSuccessJson<ServiceStatus> | IResponseErrorInternal
>;

export const PingHandler = (): InfoHandler => (): Promise<
  IResponseSuccessJson<ServiceStatus> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    resolve(
      ResponseSuccessJson<ServiceStatus>({
        message: "Function IO Web Profile is up and running"
      })
    );
  });

export const getPing = (jwtConfig: JWTConfig): express.RequestHandler => {
  const handler = PingHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyTesterJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
