/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { flow, pipe } from "fp-ts/lib/function";
import { JwtPayload } from "jsonwebtoken";
import { LockSessionData } from "../generated/definitions/external/LockSessionData";
import { FiscalCode } from "../generated/definitions/fast-login/FiscalCode";
import { Client } from "../generated/definitions/fast-login/client";
import { IConfig } from "../utils/config";
import { jwtValidationMiddleware } from "../utils/middlewares/jwt-validation-middleware";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

type ILockSessionHandler = (
  user: JwtPayload,
  payload: LockSessionData
) => Promise<IResponseSuccessNoContent | IResponseErrorInternal>;

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
            fiscal_code: user.fiscal_number as FiscalCode,
            unlock_code: payload.unlock_code
          }
        }),
      flow(E.toError, e => {
        console.log("TRYCATCH ======> ", e);
        return ResponseErrorInternal(`TRYCATCH`);
      })
    ),
    TE.chain(
      flow(
        TE.fromEither,
        TE.mapLeft(errors => {
          console.log("ERRORE ======> ", errors);
          return ResponseErrorInternal(`ERRORE VALIDATION`);
        })
      )
    ),
    TE.map(() => ResponseSuccessNoContent()),
    TE.toUnion
  )();

export const getLockSessionHandler = (
  client: LockSessionClient,
  config: IConfig
): express.RequestHandler => {
  const handler = lockSessionHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config),
    jwtValidationMiddleware(config),
    RequiredBodyPayloadMiddleware(LockSessionData)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, user, payload) => handler(user, payload))
  );
};
