import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { getValidateJWT } from "@pagopa/ts-commons/lib/jwt_with_key_rotation";
import {
  IResponseErrorForbiddenNotAuthorized,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as jwt from "jsonwebtoken";

import { AuthBearer } from "../../generated/definitions/external/AuthBearer";
import { IConfig } from "../config";
import { TokenTypes } from "../enums/TokenTypes";

export interface IExchangeJwtPayloadExtended extends jwt.JwtPayload {
  readonly name: string;
  readonly family_name: string;
  readonly fiscal_number: FiscalCode;
  readonly token_type: TokenTypes;
}

export type HslJWTValid = (
  token: NonEmptyString
) => TE.TaskEither<
  IResponseErrorForbiddenNotAuthorized,
  IExchangeJwtPayloadExtended
>;

export const exchangeJwtValidation = (
  token: NonEmptyString,
  config: IConfig
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
): HslJWTValid => () =>
  pipe(
    getValidateJWT(
      config.EXCHANGE_JWT_ISSUER,
      config.EXCHANGE_JWT_PUB_KEY
    )(token),
    TE.mapLeft(error => getResponseErrorForbiddenNotAuthorized(error.message)),
    TE.map(jwtDecoded => jwtDecoded as IExchangeJwtPayloadExtended)
  );

export const exchangeJwtValidationMiddleware = (
  config: IConfig
): IRequestMiddleware<
  "IResponseErrorForbiddenNotAuthorized",
  IExchangeJwtPayloadExtended
> => (
  req
): Promise<
  E.Either<IResponseErrorForbiddenNotAuthorized, IExchangeJwtPayloadExtended>
> =>
  pipe(
    req.headers[config.BEARER_AUTH_HEADER],
    AuthBearer.decode,
    E.mapLeft(_ =>
      getResponseErrorForbiddenNotAuthorized(
        `Invalid or missing JWT in header ${config.BEARER_AUTH_HEADER}`
      )
    ),
    E.map(authBearer => authBearer.replace("Bearer ", "") as NonEmptyString),
    TE.fromEither,
    TE.chain(token =>
      pipe(
        token,
        exchangeJwtValidation(token, config),
        TE.mapLeft(error =>
          getResponseErrorForbiddenNotAuthorized(error.detail)
        )
      )
    )
  )();
