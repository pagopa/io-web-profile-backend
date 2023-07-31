/* eslint-disable @typescript-eslint/explicit-function-return-type */

import * as express from "express";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import * as healthcheck from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as packageJson from "../package.json";

import { envConfig, IConfig } from "../utils/config";
import { ApplicationInfo } from "../generated/definitions/web-profile/ApplicationInfo";
import { verifyTesterJWTMiddleware } from "../utils/auth_jwt_tester";
import { JWTConfig } from "../utils/config";

type InfoHandler = () => Promise<
  IResponseSuccessJson<ApplicationInfo> | IResponseErrorInternal
>;

type HealthChecker = (
  config: unknown
) => healthcheck.HealthCheck<"AzureStorage" | "Config" | "AzureCosmosDB", true>;

export const InfoHandler = (
  checkApplicationHealth: HealthChecker
): InfoHandler => (): Promise<
  IResponseSuccessJson<ApplicationInfo> | IResponseErrorInternal
> =>
  pipe(
    envConfig,
    checkApplicationHealth,
    TE.map(_ =>
      ResponseSuccessJson({
        name: packageJson.name,
        version: packageJson.version
      })
    ),
    TE.mapLeft(problems => ResponseErrorInternal(problems.join("\n\n"))),
    TE.toUnion
  )();

export const Info = (jwtConfig: JWTConfig): express.RequestHandler => {
  const handler = InfoHandler(
    healthcheck.checkApplicationHealth(IConfig, [
      c => healthcheck.checkAzureCosmosDbHealth(c.COSMOSDB_URI, c.COSMOSDB_KEY),
      c => healthcheck.checkAzureStorageHealth(c.QueueStorageConnection)
    ])
  );
  const middlewaresWrap = withRequestMiddlewares(
    verifyTesterJWTMiddleware(jwtConfig)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
