import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FastLoginClientConfig, IConfig, JWTConfig } from "../utils/config";
import { FeatureFlag, FeatureFlagEnum } from "../utils/featureFlags/featureFlags";

const iconfig = {
  AzureWebJobsStorage: "azureWebJobsStorage" as NonEmptyString,
  BETA_TESTERS: ["ISPXNB32R82Y766D"],
  COSMOSDB_KEY: "cosmosdbKey" as NonEmptyString,
  COSMOSDB_NAME: "cosmosdbName" as NonEmptyString,
  COSMOSDB_URI: "cosmosdbUri" as NonEmptyString,
  FF_API_ENABLED: FeatureFlagEnum.ALL,
  QueueStorageConnection: "queueStorageConnection" as NonEmptyString,
  isProduction: false
};

export const jwtConfig: JWTConfig = {
  BEARER_AUTH_HEADER: "authorization" as NonEmptyString,
  HUB_SPID_LOGIN_JWT_ISSUER: "hslIssuer" as NonEmptyString,
  HUB_SPID_LOGIN_JWT_KEY: "hslKey" as NonEmptyString,
  ISSUER: "PAGOPA" as NonEmptyString,
  JWT_TTL: 900,
  PRIMARY_PRIVATE_KEY: "primaryPrivateKey" as NonEmptyString,
  PRIMARY_PUBLIC_KEY: "primaryPublicKey" as NonEmptyString
};

export const fastLoginClientConfig: FastLoginClientConfig = {
  FAST_LOGIN_API_KEY: "fastLoginApiKey" as NonEmptyString,
  FAST_LOGIN_CLIENT_BASE_URL: "fastLoginClientBaseUrl" as NonEmptyString
};

export const config: IConfig = {
  ...iconfig,
  ...jwtConfig,
  ...fastLoginClientConfig
};
