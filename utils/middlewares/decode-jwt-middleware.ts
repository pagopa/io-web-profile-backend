/* eslint-disable sort-keys */
// TODO: Move this file into io-functions-commons
import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as jwt from "jsonwebtoken";
import { AuthBearer } from "../../generated/definitions/external/AuthBearer";
import { IConfig } from "../config";

export const User = t.type({
  name: t.string,
  family_name: t.string,
  fiscal_number: FiscalCode
});
export type User = t.TypeOf<typeof User>;

export type UserFromJWT = (token: NonEmptyString) => TE.TaskEither<Error, User>;

export const extractUserFromJwt = (
  token: NonEmptyString
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
): UserFromJWT => () =>
  pipe(
    jwt.decode(token),
    User.decode,
    TE.fromEither,
    TE.mapLeft(() => new Error("Unable to decode JWT"))
  );

/**
 * Returns a request middleware that extract an optional
 * parameter in the request.header.
 *
 * @param name  The name of the header
 * @param type  The io-ts Type for validating the parameter
 */
export const DecodeJWTFromHeaderMiddleware = (
  config: IConfig
): IRequestMiddleware<"IResponseErrorInternal", User> => async (
  request
): Promise<E.Either<IResponseErrorInternal, User>> =>
  pipe(
    request.header(config.BEARER_AUTH_HEADER),
    AuthBearer.decode,
    E.mapLeft(_ => ResponseErrorInternal("JWT Data missing")),
    E.map(authBearer => authBearer.replace("Bearer ", "") as NonEmptyString),
    TE.fromEither,
    TE.chain(token =>
      pipe(
        token,
        extractUserFromJwt(token),
        TE.mapLeft(_ => ResponseErrorInternal("JWT Data missing"))
      )
    )
  )();
