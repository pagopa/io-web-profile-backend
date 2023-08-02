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

import { Profile } from "../generated/definitions/external/Profile";
import { verifyJWTMiddleware } from "../utils/auth-jwt";
import { JWTConfig } from "../utils/config";
import { MOCK_RESPONSES, isMockedApi } from "../utils/mockapi_utils";

type InfoHandler = () => Promise<
  IResponseSuccessJson<Profile> | IResponseErrorInternal
>;

export const ProfileHandler = (): InfoHandler => (): Promise<
  IResponseSuccessJson<Profile> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    resolve(
      ResponseSuccessJson<Profile>(isMockedApi ? MOCK_RESPONSES.profile : {})
    );
  });

export const getProfile = (jwtConfig: JWTConfig): express.RequestHandler => {
  const handler = ProfileHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
