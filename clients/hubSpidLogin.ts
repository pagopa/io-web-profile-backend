import nodeFetch from "node-fetch";
import { INonEmptyStringTag } from "@pagopa/ts-commons/lib/strings";
import {
  Client,
  createClient
} from "../generated/definitions/hub-spid-login/client";

const tokenX: string & INonEmptyStringTag = "A" as string & INonEmptyStringTag;
export const getHubSpidLoginClient = (
  baseUrl: string,
  basePath?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"body"> =>
  createClient({
    basePath,
    baseUrl,
    fetchApi,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    withDefaults: op => params =>
      op({
        ...params,
        body: { token: tokenX }
      })
  });

export type GetHubSpidLoginClient = typeof getHubSpidLoginClient;
