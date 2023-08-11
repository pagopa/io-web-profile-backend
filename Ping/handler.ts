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

import * as T from "fp-ts/Task";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import { IConfig } from "../utils/config";
import { ServiceStatus } from "../generated/definitions/external/ServiceStatus";
import {
  hslJwtValidationMiddleware,
  IHslJwtPayloadExtended
} from "../utils/middlewares/hsl-jwt-validation-middleware";

type PingHandler = (
  tokenPayload: IHslJwtPayloadExtended
) => Promise<IResponseSuccessJson<ServiceStatus> | IResponseErrorInternal>;

export const PingHandler = (): PingHandler => (
  tokenPayload: IHslJwtPayloadExtended
): Promise<IResponseSuccessJson<ServiceStatus> | IResponseErrorInternal> =>
  // eslint-disable-next-line no-console
  T.of(
    ResponseSuccessJson<ServiceStatus>({
      message: "Function IO Web Profile is up and running"
    })
  )();

export const getPing = (config: IConfig): express.RequestHandler => {
  const handler = PingHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config),
    hslJwtValidationMiddleware(config)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, tokenPayload) => handler(tokenPayload))
  );
};
