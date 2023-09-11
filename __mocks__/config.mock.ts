import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { sign } from "jsonwebtoken";
import {
  FastLoginClientConfig,
  FunctionsAppClientConfig,
  HSLConfig,
  IConfig,
  JWTConfig
} from "../utils/config";
import { FeatureFlagEnum } from "../utils/featureFlags/featureFlags";
import { generateKeyPairSync } from "crypto";

const aFiscalCode = "ISPXNB32R82Y766D";
const aName = "Carla";
const aFamilyName = "Rossi";
const iconfig = {
  AzureWebJobsStorage: "azureWebJobsStorage" as NonEmptyString,
  BETA_TESTERS: [aFiscalCode],
  COSMOSDB_KEY: "cosmosdbKey" as NonEmptyString,
  COSMOSDB_NAME: "cosmosdbName" as NonEmptyString,
  COSMOSDB_URI: "cosmosdbUri" as NonEmptyString,
  FF_API_ENABLED: FeatureFlagEnum.ALL,
  QueueStorageConnection: "queueStorageConnection" as NonEmptyString,
  isProduction: false
};

const {
  privateKey: hslPrivateKey,
  publicKey: hslPublicKey
} = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem"
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem"
  }
});

const {
  privateKey: exchangePrivateKey,
  publicKey: exchangePublicKey
} = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem"
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem"
  }
});

const hslIssuer = "SPID";
const exchangeIssuer = "PAGOPA";

const jwt = sign(
  { name: aName, family_name: aFamilyName, fiscal_number: aFiscalCode },
  hslPrivateKey,
  { algorithm: "RS256", issuer: hslIssuer }
);

export const jwtConfig: JWTConfig = {
  BEARER_AUTH_HEADER: "authorization" as NonEmptyString,
  HUB_SPID_LOGIN_JWT_ISSUER: hslIssuer as NonEmptyString,
  HUB_SPID_LOGIN_JWT_PUB_KEY: hslPublicKey as NonEmptyString,
  EXCHANGE_JWT_ISSUER: exchangeIssuer as NonEmptyString,
  EXCHANGE_JWT_PUB_KEY: exchangePublicKey as NonEmptyString,
  EXCHANGE_JWT_PRIVATE_KEY: exchangePrivateKey as NonEmptyString,
  EXCHANGE_JWT_TTL: 3600
};

export const hslConfig: HSLConfig = {
  HUB_SPID_LOGIN_MOCK_TOKEN: jwt as NonEmptyString,
  HUB_SPID_LOGIN_API_KEY: "hslApiKey" as NonEmptyString,
  HUB_SPID_LOGIN_CLIENT_BASE_URL: "http://localhost:9090" as NonEmptyString
};

export const fastLoginClientConfig: FastLoginClientConfig = {
  FAST_LOGIN_API_KEY: "fastLoginApiKey" as NonEmptyString,
  FAST_LOGIN_CLIENT_BASE_URL: "fastLoginClientBaseUrl" as NonEmptyString
};

export const functionsAppClientConfig: FunctionsAppClientConfig = {
  FUNCTIONS_APP_CLIENT_BASE_URL: "functionsAppClientBaseUrl" as NonEmptyString,
  FUNCTIONS_APP_SUBSCRIPTION_KEY: "functionsAppApiKey" as NonEmptyString
};

export const config: IConfig = {
  ...iconfig,
  ...jwtConfig,
  ...hslConfig,
  ...fastLoginClientConfig,
  ...functionsAppClientConfig
};
