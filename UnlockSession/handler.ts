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
import { UnlockCode } from "../generated/definitions/external/UnlockCode";

type IUnlockSessionHandler = (
  user: IHslJwtPayloadExtended,
  payload: UnlockSessionData
) => Promise<
  | IResponseSuccessNoContent
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
>;

type UnlockSessionClient = Client<"ApiKeyAuth">;

const canUnlock = (
  user: IHslJwtPayloadExtended,
  unlock_code: UnlockCode | undefined
): boolean =>
  user.spid_level === SpidLevel.L3 ||
  (user.spid_level === SpidLevel.L2 && unlock_code !== undefined);

export const unlockSessionHandler = (
  client: UnlockSessionClient
): IUnlockSessionHandler => (
  reqJwtData,
  reqPayload
): ReturnType<IUnlockSessionHandler> =>
  pipe(
    TE.Do,
    TE.bind("user_data", () => TE.of(reqJwtData)),
    TE.bind("unlock_code", () => TE.of(reqPayload.unlock_code)),
    TE.chain(
      TE.fromPredicate(
        ({ user_data, unlock_code }) => canUnlock(user_data, unlock_code),
        ({ user_data, unlock_code }) =>
          getResponseErrorForbiddenNotAuthorized(
            `Could not perform unlock-session. SpidLevel: {${user_data.spid_level}}, UnlockCode: {${unlock_code}}`
          )
      )
    ),
    TE.chainW(({ user_data, unlock_code }) =>
      TE.tryCatch(
        () =>
          client.unlockUserSession({
            body: {
              fiscal_code: user_data.fiscal_number,
              unlock_code
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
        TE.chainW(response => {
          switch (response.status) {
            case 204:
            case 409:
              return TE.right(ResponseSuccessNoContent());
            default:
              return TE.left(
                ResponseErrorInternal(
                  `Something gone wrong. Response Status: {${response.status}}`
                )
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
