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

import { ProfileData } from "../generated/definitions/external/ProfileData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";
import { MOCK_RESPONSES, isMockedApi } from "../utils/mockapi_utils";

type IProfileHandler = () => Promise<
  IResponseSuccessJson<ProfileData> | IResponseErrorInternal
>;

export const ProfileHandler = (): IProfileHandler => (): Promise<
  IResponseSuccessJson<ProfileData> | IResponseErrorInternal
> =>
  new Promise(resolve => {
    /* TODO: real logic */
    resolve(
      ResponseSuccessJson<ProfileData>(
        isMockedApi
          ? MOCK_RESPONSES.profile
          : { family_name: "pluto", name: "pippo" }
      )
    );
  });

export const getProfile = (config: IConfig): express.RequestHandler => {
  const handler = ProfileHandler();
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
