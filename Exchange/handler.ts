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

import { ExchangeToken } from "../generated/definitions/external/ExchangeToken";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import { MOCK_RESPONSES, isMockedApi } from "../utils/mockapi_utils";

type IExchangeHandler = () => Promise<
  IResponseSuccessJson<ExchangeToken> | IResponseErrorInternal
>;

export const ExchangeHandler = (): IExchangeHandler => (): Promise<
  IResponseSuccessJson<ExchangeToken> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    if (isMockedApi) {
      resolve(ResponseSuccessJson(MOCK_RESPONSES.exchange));
    }
  });

export const exchangeToken = (config: IConfig): express.RequestHandler => {
  const handler = ExchangeHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
