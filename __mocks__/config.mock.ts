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
import { Second } from "@pagopa/ts-commons/lib/units";

const aFiscalCode = "ISPXNB32R82Y766D";
const aName = "Carla";
const aFamilyName = "Rossi";
const iconfig = {
  AzureWebJobsStorage: "azureWebJobsStorage" as NonEmptyString,
  BETA_TESTERS: [aFiscalCode],
  FF_API_ENABLED: FeatureFlagEnum.ALL,
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

const {
  privateKey: magicLinkPrivateKey,
  publicKey: magicLinkPublicKey
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
const magicLinkIssuer = "PAGOPA";

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
  EXCHANGE_JWT_TTL: 3600,
  MAGIC_LINK_JWE_ISSUER: magicLinkIssuer as NonEmptyString,
  MAGIC_LINK_JWE_PRIVATE_KEY: magicLinkPrivateKey as NonEmptyString,
  MAGIC_LINK_JWE_TTL: 604800 as Second
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
  FUNCTIONS_APP_API_KEY: "functionsAppApiKey" as NonEmptyString,
  FUNCTIONS_APP_CLIENT_BASE_URL: "functionsAppClientBaseUrl" as NonEmptyString,
};

export const config: IConfig = {
  ...iconfig,
  ...jwtConfig,
  ...hslConfig,
  ...fastLoginClientConfig,
  ...functionsAppClientConfig
};
