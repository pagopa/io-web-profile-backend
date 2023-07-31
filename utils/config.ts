/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { NumberFromString, withFallback } from "io-ts-types";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { FeatureFlag, FeatureFlagEnum } from "./featureFlags";
import { CommaSeparatedListOf } from "./separated-list";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
// eslint-disable-next-line @typescript-eslint/ban-types

export type JWTConfig = t.TypeOf<typeof JWTConfig>;
export const JWTConfig = t.intersection([
  t.type({
    BEARER_AUTH_HEADER: NonEmptyString,
    ISSUER: NonEmptyString,

    JWT_TTL: withDefault(t.string, "900").pipe(NumberFromString),

    PRIMARY_PRIVATE_KEY: NonEmptyString,
    PRIMARY_PUBLIC_KEY: NonEmptyString
  }),
  t.partial({
    SECONDARY_PUBLIC_KEY: NonEmptyString
  })
]);

export const IConfig = t.intersection([
  t.interface({
    AzureWebJobsStorage: NonEmptyString,

    COSMOSDB_KEY: NonEmptyString,
    COSMOSDB_NAME: NonEmptyString,
    COSMOSDB_URI: NonEmptyString,

    FF_API_ENABLED: withFallback(FeatureFlag, FeatureFlagEnum.NONE),

    QueueStorageConnection: NonEmptyString,

    isProduction: t.boolean
  }),
  JWTConfig
]);

export const BETA_TESTERS = pipe(
  process.env.BETA_TESTERS,
  CommaSeparatedListOf(FiscalCode).decode,
  E.getOrElseW(err => {
    throw new Error(`Invalid LV_TEST_USERS value: ${readableReport(err)}`);
  })
);

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
