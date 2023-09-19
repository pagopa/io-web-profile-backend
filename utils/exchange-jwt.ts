import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { getGenerateJWT } from "@pagopa/ts-commons/lib/jwt_with_key_rotation";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";

import { JWTConfig } from "./config";
import { BaseJwtPayload } from "./jwt";

export type MagicLinkPayload = t.TypeOf<typeof MagicLinkPayload>;
export const MagicLinkPayload = t.strict({
  family_name: NonEmptyString,
  fiscal_number: FiscalCode,
  name: NonEmptyString
});

export type ExchangeJWT = t.TypeOf<typeof ExchangeJWT>;
export const ExchangeJWT = t.intersection([
  BaseJwtPayload,
  t.type({
    token_type: NonEmptyString
  })
]);

export type GenerateExchangeJWT = (
  exchangeJwt: ExchangeJWT
) => TE.TaskEither<Error, NonEmptyString>;

export const getGenerateExchangeJWT = ({
  EXCHANGE_JWT_ISSUER,
  EXCHANGE_JWT_TTL,
  EXCHANGE_JWT_PRIVATE_KEY
}: JWTConfig): GenerateExchangeJWT =>
  pipe(
    getGenerateJWT(EXCHANGE_JWT_ISSUER, EXCHANGE_JWT_PRIVATE_KEY),
    generateJWTFunction => (exchangeJWT): ReturnType<GenerateExchangeJWT> =>
      generateJWTFunction(exchangeJWT, EXCHANGE_JWT_TTL as Second)
  );
