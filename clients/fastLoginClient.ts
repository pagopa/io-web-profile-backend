import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../generated/definitions/fast-login/client";

export const getFastLoginClient = (
  apiKeyAuth: string,
  baseUrl: string,
  basePath?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"ApiKeyAuth"> =>
  createClient<"ApiKeyAuth">({
    basePath,
    baseUrl,
    fetchApi,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    withDefaults: op => params =>
      op({
        ...params,
        ApiKeyAuth: apiKeyAuth
      })
  });

export type GetFastLoginClient = typeof getFastLoginClient;
