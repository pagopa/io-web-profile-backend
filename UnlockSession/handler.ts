/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent,
  getResponseErrorForbiddenNotAuthorized
  // getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { flow, pipe } from "fp-ts/lib/function";
import { UnlockSessionData } from "../generated/definitions/external/UnlockSessionData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import {
  IHslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";
import { SpidLevel } from "../utils/enums/SpidLevels";
import { Client } from "../generated/definitions/fast-login/client";

type IUnlockSessionHandler = (
  user: IHslJwtPayloadExtended,
  payload: UnlockSessionData
) => Promise<
  | IResponseSuccessNoContent
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
>;

type UnlockSessionClient = Client<"ApiKeyAuth">;

interface IUnlockSessionPayload {
  readonly user: IHslJwtPayloadExtended;
  readonly payload: UnlockSessionData;
}

const toUnlockSessionPayload = (
  user: IHslJwtPayloadExtended,
  payload: UnlockSessionData
): IUnlockSessionPayload => ({
  payload,
  user
});

const canUnlock = ({ user, payload }: IUnlockSessionPayload): boolean =>
  user.spid_level === SpidLevel.L3 ||
  (user.spid_level === SpidLevel.L2 && payload.unlock_code !== undefined);

export const unlockSessionHandler = (
  client: UnlockSessionClient
): IUnlockSessionHandler => (
  user,
  payload
): ReturnType<IUnlockSessionHandler> =>
  pipe(
    toUnlockSessionPayload(user, payload),
    TE.fromPredicate(
      o => canUnlock(o),
      o =>
        getResponseErrorForbiddenNotAuthorized(
          `Could not perform unlock-session. SpidLevel: {${o.user.spid_level}}, UnlockCode: {${o.payload.unlock_code}}`
        )
    ),
    TE.chainW(x =>
      TE.tryCatch(
        () =>
          client.unlockUserSession({
            body: {
              // eslint-disable-next-line sonarjs/no-duplicate-string
              fiscal_code: x.user.fiscal_number,
              unlock_code: x.payload.unlock_code
            }
          }),
        flow(E.toError, e =>
          ResponseErrorInternal(
            `Something gone wrong calling fast-login: ${e.message}`
          )
        )
      )
    ),
    TE.chainW(
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
              return ResponseErrorInternal(
                `Something gone wrong. Response Status: {${response.status}}`
              );
          }
        })
      )
    ),
    TE.toUnion
  )();

export const getUnlockSessionHandler = (
  client: UnlockSessionClient,
  config: IConfig
): express.RequestHandler => {
  const handler = unlockSessionHandler(client);
  const middlewaresWrap = withRequestMiddlewares(
    verifyUserEligibilityMiddleware(config),
    hslJwtValidationMiddleware(config),
    RequiredBodyPayloadMiddleware(UnlockSessionData)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, user, payload) => handler(user, payload))
  );
};
