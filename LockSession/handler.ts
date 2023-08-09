/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { flow, pipe } from "fp-ts/lib/function";
import { LockSessionData } from "../generated/definitions/external/LockSessionData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import { Client } from "../generated/definitions/fast-login/client";
import {
  IHslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";

type ILockSessionHandler = (
  user: IHslJwtPayloadExtended,
  payload: LockSessionData
) => Promise<
  IResponseSuccessNoContent | IResponseErrorNotFound | IResponseErrorInternal
>;

type LockSessionClient = Client<"ApiKeyAuth">;

export const lockSessionHandler = (
  client: LockSessionClient
): ILockSessionHandler => (user, payload): ReturnType<ILockSessionHandler> =>
  pipe(
    TE.tryCatch(
      () =>
        client.lockUserSession({
          body: {
            // eslint-disable-next-line sonarjs/no-duplicate-string
            fiscal_code: user.fiscal_number,
            unlock_code: payload.unlock_code
          }
        }),
      flow(E.toError, () =>
        ResponseErrorInternal(`Something gone wrong calling fast-login`)
      )
    ),
    TE.chain(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        TE.map(response => {
          switch (response.status) {
            case 204:
            case 409:
              return ResponseSuccessNoContent();
            default:
              return ResponseErrorInternal(`Something gone wrong`);
          }
        })
      )
    ),
    TE.toUnion
  )();

export const getLockSessionHandler = (
  client: LockSessionClient,
  config: IConfig
): express.RequestHandler => {
  const handler = lockSessionHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config),
    hslJwtValidationMiddleware(config),
    RequiredBodyPayloadMiddleware(LockSessionData)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, user, payload) => handler(user, payload))
  );
};
