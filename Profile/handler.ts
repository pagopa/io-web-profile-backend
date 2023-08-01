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

import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { Profile } from "../generated/definitions/external/Profile";
import { verifyTesterJWTMiddleware } from "../utils/auth_jwt_tester";
import { JWTConfig } from "../utils/config";
import { isMockedApi } from "../utils/env_utils";

type InfoHandler = () => Promise<
  IResponseSuccessJson<Profile> | IResponseErrorInternal
>;

const mockedProfile: Profile = {
  email: "test@io.pagopa.it" as EmailString
};
export const ProfileHandler = (): InfoHandler => (): Promise<
  IResponseSuccessJson<Profile> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    resolve(ResponseSuccessJson<Profile>(isMockedApi() ? mockedProfile : {}));
  });

export const getProfile = (jwtConfig: JWTConfig): express.RequestHandler => {
  const handler = ProfileHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyTesterJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
