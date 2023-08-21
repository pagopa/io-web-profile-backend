import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as jwt from "jsonwebtoken";
import { getValidateJWT } from "@pagopa/ts-commons/lib/jwt_with_key_rotation";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  getResponseErrorForbiddenNotAuthorized,
  IResponseErrorForbiddenNotAuthorized,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseSuccessJson,
  ResponseErrorInternal,
  IResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { AuthBearer } from "../../generated/definitions/external/AuthBearer";
import { IConfig } from "../config";
import { getHubSpidLoginClient } from "../../clients/hubSpidLogin";
import { IntrospectSuccessResponse } from "../../generated/definitions/hub-spid-login/IntrospectSuccessResponse";

export interface IHslJwtPayloadExtended extends jwt.JwtPayload {
  readonly name: string;
  readonly family_name: string;
  readonly fiscal_number: FiscalCode;
}

type IjwtIntrospectionCall = (
  token: NonEmptyString,
  config: IConfig
) => TE.TaskEither<
  IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
  IResponseSuccessJson<IntrospectSuccessResponse>
>;
export const introspectionCall: IjwtIntrospectionCall = (token, config) =>
  pipe(
    TE.tryCatch(
      () =>
        getHubSpidLoginClient(
          config.HUB_SPID_LOGIN_CLIENT_BASE_URL
        ).introspectToken({
          body: {
            token
          }
        }),
      flow(E.toError, () =>
        ResponseErrorInternal(
          `Something went wrong while calling the introspection endpoint`
        )
      )
    ),
    TE.chain(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        TE.chainW(response => {
          switch (response.status) {
            case 200:
              return response.value.active
                ? TE.right(ResponseSuccessJson(response.value))
                : TE.left<
                    | IResponseErrorForbiddenNotAuthorized
                    | IResponseErrorInternal
                  >(ResponseErrorForbiddenNotAuthorized);
            case 403:
              return TE.left<
                IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal
              >(ResponseErrorForbiddenNotAuthorized);
            default:
              return TE.left(ResponseErrorInternal(`Something went wrong`));
          }
        })
      )
    )
  );

export type HslJWTValid = (
  token: NonEmptyString
) => TE.TaskEither<Error, IHslJwtPayloadExtended>;

export const hslJwtValidation = (
  token: NonEmptyString,
  config: IConfig
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
): HslJWTValid => () =>
  pipe(
    getValidateJWT(
      config.HUB_SPID_LOGIN_JWT_ISSUER,
      config.HUB_SPID_LOGIN_JWT_PUB_KEY
    )(token),
    TE.chain(jwtDecoded =>
      pipe(
        introspectionCall(token, config),
        TE.fold(
          _ => TE.left(new Error("Something went wrong")),
          // active is always true if we are in this rail
          _ => TE.right(jwtDecoded as IHslJwtPayloadExtended)
        )
      )
    )
  );

export const hslJwtValidationMiddleware = (
  config: IConfig
): IRequestMiddleware<
  "IResponseErrorForbiddenNotAuthorized",
  IHslJwtPayloadExtended
> => (
  req
): Promise<
  E.Either<IResponseErrorForbiddenNotAuthorized, IHslJwtPayloadExtended>
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
        hslJwtValidation(token, config),
        TE.mapLeft(error =>
          getResponseErrorForbiddenNotAuthorized(error.message)
        )
      )
    )
  )();
