/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
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

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { LockSessionData } from "../generated/definitions/external/LockSessionData";
import { UnlockCode } from "../generated/definitions/external/UnlockCode";
import { Client } from "../generated/definitions/external/client";
import { IConfig, LockSessionClientConfig } from "../utils/config";
import {
  DecodeJWTFromHeaderMiddleware,
  User
} from "../utils/middlewares/decode-jwt-middleware";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

type ILockSessionHandler = (
  user: User,
  payload: LockSessionData
) => Promise<IResponseSuccessNoContent | IResponseErrorInternal>;

type LockSessionClient = Client<"body">;

type LockSessionInternalData = {
  readonly unlock_code: UnlockCode;
  readonly fiscal_code: FiscalCode;
};

export const lockSessionHandler = (
  client: LockSessionClient,
  clientConfig: LockSessionClientConfig
): ILockSessionHandler => async (
  user,
  payload
): Promise<IResponseSuccessNoContent | IResponseErrorInternal> =>
  new Promise(resolve => {
    console.log("user ", user);
    resolve(ResponseSuccessNoContent());
  });

export const getLockSessionHandler = (
  client: LockSessionClient,
  config: IConfig
): express.RequestHandler => {
  const handler = lockSessionHandler(client, config);
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config),
    DecodeJWTFromHeaderMiddleware(config),
    RequiredBodyPayloadMiddleware(LockSessionData)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, user, payload) => handler(user, payload))
  );
};
