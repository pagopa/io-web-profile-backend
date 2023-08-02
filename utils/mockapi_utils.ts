import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { SessionState } from "../generated/definitions/external/SessionState";
import { SessionInfo } from "../generated/definitions/external/SessionInfo";

export const isMockedApi: boolean = process.env.MOCK_API === "true";

const sessionInfo: SessionInfo = {
  active: true,
  expiration_date: new Date("2023-08-31")
};
const sessionState: SessionState = {
  access_enabled: true,
  session_info: sessionInfo
};
export const MOCK_RESPONSES = {
  profile: {
    email: "test@io.pagopa.it" as EmailString
  },
  sessionState
};

// type ObjectKey = keyof typeof MOCK_RESPONSES;
// /**
//  * Middleware that checks if a given endpoint is mocked and returns the mocked response
//  */
// export const mockMiddleware = (endpoint: ObjectKey): unknown => {
//   if (isMockedApi) {
//     return MOCK_RESPONSES[endpoint];
//   }
// };
