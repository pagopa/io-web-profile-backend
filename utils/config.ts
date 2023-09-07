/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { withFallback } from "io-ts-types";

import { CommaSeparatedListOf } from "@pagopa/ts-commons/lib/comma-separated-list";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FeatureFlag, FeatureFlagEnum } from "./featureFlags/featureFlags";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
// eslint-disable-next-line @typescript-eslint/ban-types

export type JWTConfig = t.TypeOf<typeof JWTConfig>;
export const JWTConfig = t.intersection([
  t.type({
    BEARER_AUTH_HEADER: NonEmptyString,
    EXCHANGE_JWT_ISSUER: NonEmptyString,
    EXCHANGE_JWT_PUB_KEY: NonEmptyString,
    HUB_SPID_LOGIN_JWT_ISSUER: NonEmptyString,
    HUB_SPID_LOGIN_JWT_PUB_KEY: NonEmptyString
  }),
  t.partial({})
]);

export type HSLConfig = t.TypeOf<typeof HSLConfig>;
export const HSLConfig = t.intersection([
  t.type({
    HUB_SPID_LOGIN_API_KEY: NonEmptyString,
    HUB_SPID_LOGIN_CLIENT_BASE_URL: NonEmptyString
  }),
  t.partial({
    HUB_SPID_LOGIN_MOCK_TOKEN: NonEmptyString
  })
]);

// Fast Login Client Configuration
export const FastLoginClientConfig = t.type({
  FAST_LOGIN_API_KEY: NonEmptyString,
  FAST_LOGIN_CLIENT_BASE_URL: NonEmptyString
});
export type FastLoginClientConfig = t.TypeOf<typeof FastLoginClientConfig>;

// Fast Login Client Configuration
export const FunctionsAppClientConfig = t.type({
  FUNCTIONS_APP_CLIENT_BASE_URL: NonEmptyString,
  FUNCTIONS_APP_SUBSCRIPTION_KEY: NonEmptyString
});
export type FunctionsAppClientConfig = t.TypeOf<
  typeof FunctionsAppClientConfig
>;

export const IConfig = t.intersection([
  t.interface({
    AzureWebJobsStorage: NonEmptyString,
    BETA_TESTERS: CommaSeparatedListOf(FiscalCode),
    COSMOSDB_KEY: NonEmptyString,
    COSMOSDB_NAME: NonEmptyString,
    COSMOSDB_URI: NonEmptyString,
    FF_API_ENABLED: withFallback(FeatureFlag, FeatureFlagEnum.NONE),
    QueueStorageConnection: NonEmptyString,
    isProduction: t.boolean
  }),
  JWTConfig,
  FastLoginClientConfig,
  FunctionsAppClientConfig,
  HSLConfig
]);

export const envConfig = {
  ...process.env,
  isProduction: process.env.NODE_ENV === "production"
};

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors: ReadonlyArray<t.ValidationError>) => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    })
  );
