import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { SessionInfo } from "../generated/definitions/external/SessionInfo";
import { SessionState } from "../generated/definitions/external/SessionState";

export const isMockedApi: boolean = process.env.MOCK_API === "true";

// #region sessionState
const activeSessionInfo: SessionInfo = {
  active: true,
  expiration_date: new Date("2023-08-31")
};
const activeSessionState: SessionState = {
  access_enabled: true,
  session_info: activeSessionInfo
};
const inactiveSessionInfo: SessionInfo = {
  active: false
};
const inactiveSessionState: SessionState = {
  access_enabled: true,
  session_info: inactiveSessionInfo
};
const lockedSessionInfo: SessionInfo = {
  active: false
};
const lockedSessionState: SessionState = {
  access_enabled: false,
  session_info: lockedSessionInfo
};

const SESSION_STATE: { readonly [index: string]: SessionState } = {
  ACTIVE: activeSessionState,
  INACTIVE: inactiveSessionState,
  LOCKED: lockedSessionState
};

const sessionStateKey = process.env.SESSION_STATE || "ACTIVE";
// #endregion

// #region exchange
const exchangeToken = process.env.MOCKED_EXCHANGE_JWT;
// #endregion

export const MOCK_RESPONSES = {
  exchange: {
    jwt: exchangeToken
  },
  profile: {
    email: "test@io.pagopa.it" as EmailString,
    family_name: "Rossi",
    name: "Carla"
  },
  sessionState: SESSION_STATE[sessionStateKey]
};
