import { getValidateJWT } from "@pagopa/ts-commons/lib/jwt_with_key_rotation";
import {
  IResponseErrorForbiddenNotAuthorized,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as jwt from "jsonwebtoken";
import * as t from "io-ts";
import { enumType } from "@pagopa/ts-commons/lib/types";
import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { jwtValidationMiddleware } from "../jwt";
import { IConfig } from "../config";
import { TokenTypes } from "../enums/TokenTypes";
import { BaseJwtPayload } from "../jwt";

export const ExchangeJwtPayloadExtended = t.intersection([
  BaseJwtPayload,
  t.type({
    token_type: enumType(TokenTypes, "tokenType")
  })
]);
export type ExchangeJwtPayloadExtended = t.TypeOf<
  typeof ExchangeJwtPayloadExtended
>;

export const exchangeJwtValidation = (config: IConfig) => (
  token: NonEmptyString
): TE.TaskEither<IResponseErrorForbiddenNotAuthorized, jwt.JwtPayload> =>
  pipe(
    getValidateJWT(
      config.EXCHANGE_JWT_ISSUER,
      config.EXCHANGE_JWT_PUB_KEY
    )(token),
    TE.mapLeft(error => getResponseErrorForbiddenNotAuthorized(error.message))
  );

export const exchangeJwtValidationMiddleware = (
  config: IConfig
): IRequestMiddleware<
  "IResponseErrorForbiddenNotAuthorized",
  ExchangeJwtPayloadExtended
> =>
  jwtValidationMiddleware(
    config,
    exchangeJwtValidation(config),
    ExchangeJwtPayloadExtended
  );
