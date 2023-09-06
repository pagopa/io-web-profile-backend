import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { SequenceMiddleware } from "@pagopa/ts-commons/lib/sequence_middleware";

import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessNoContent,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessNoContent,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { defaultLog } from "@pagopa/winston-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { UnlockSessionData } from "../generated/definitions/external/UnlockSessionData";
import { IConfig } from "../utils/config";
import { verifyUserEligibilityMiddleware } from "../utils/middlewares/user-eligibility-middleware";

import { UnlockCode } from "../generated/definitions/external/UnlockCode";
import { Client } from "../generated/definitions/fast-login/client";
import { SpidLevel } from "../utils/enums/SpidLevels";
import {
  IExchangeJwtPayloadExtended,
  exchangeJwtValidationMiddleware
} from "../utils/middlewares/exchange-jwt-validation-middleware";
import {
  IHslJwtPayloadExtended,
  hslJwtValidationMiddleware
} from "../utils/middlewares/hsl-jwt-validation-middleware";
import { TokenTypes } from "../utils/enums/TokenTypes";

type IUnlockSessionErrorResponses =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal;

type IUnlockSessionHandler = (
  user: IHslJwtPayloadExtended | IExchangeJwtPayloadExtended,
  payload: UnlockSessionData
) => Promise<IResponseSuccessNoContent | IUnlockSessionErrorResponses>;

type UnlockSessionClient = Client<"ApiKeyAuth">;

const canUnlock = (
  user: IHslJwtPayloadExtended | IExchangeJwtPayloadExtended,
  unlock_code: O.Option<UnlockCode>
): boolean =>
  TokenTypes.EXCHANGE === user.token_type ||
  user.spid_level === SpidLevel.L3 ||
  (user.spid_level === SpidLevel.L2 && O.isSome(unlock_code));

export const unlockSessionHandler = (
  client: UnlockSessionClient
): IUnlockSessionHandler => (
  reqJwtData,
  reqPayload
): ReturnType<IUnlockSessionHandler> =>
  pipe(
    TE.Do,
    TE.bind("user_data", () => TE.of(reqJwtData)),
    TE.bind("unlock_code", () => TE.of(O.fromNullable(reqPayload.unlock_code))),
    TE.chain(
      flow(
        TE.fromPredicate(
          ({ user_data, unlock_code }) => canUnlock(user_data, unlock_code),
          ({ user_data, unlock_code }) =>
            getResponseErrorForbiddenNotAuthorized(
              `Could not perform unlock-session. SpidLevel: {${user_data.spid_level}}, UnlockCode: {${unlock_code}}`
            )
        ),
        defaultLog.taskEither.errorLeft(
          errorResponse => `${errorResponse.detail}`
        )
      )
    ),
    TE.chainW(({ user_data, unlock_code }) =>
      TE.tryCatch(
        () =>
          client.unlockUserSession({
            body: {
              fiscal_code: user_data.fiscal_number,
              unlock_code: O.toUndefined(unlock_code)
            }
          }),
        flow(
          E.toError,
          e =>
            ResponseErrorInternal(
              `Something gone wrong calling fast-login: ${e.message}`
            ),
          defaultLog.peek.error(e => `${e.detail}`)
        )
      )
    ),
    TE.chainW(
      flow(
        TE.fromEither,
        TE.mapLeft(errors =>
          ResponseErrorInternal(readableReportSimplified(errors))
        ),
        defaultLog.taskEither.errorLeft(e => `${e.detail}`),
        TE.chainW(response => {
          switch (response.status) {
            case 204:
              return TE.right(ResponseSuccessNoContent());
            case 403:
              return TE.left<
                IUnlockSessionErrorResponses,
                IResponseSuccessNoContent
              >(getResponseErrorForbiddenNotAuthorized(`Forbidden`));
            default:
              return TE.left<
                IUnlockSessionErrorResponses,
                IResponseSuccessNoContent
              >(
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
    ContextMiddleware(),
    verifyUserEligibilityMiddleware(config),
    SequenceMiddleware(ResponseErrorForbiddenNotAuthorized)(
      hslJwtValidationMiddleware(config),
      exchangeJwtValidationMiddleware(config)
    ),
    RequiredBodyPayloadMiddleware(UnlockSessionData)
  );

  return wrapRequestHandler(
    middlewaresWrap((_, __, user, payload) => handler(user, payload))
  );
};
