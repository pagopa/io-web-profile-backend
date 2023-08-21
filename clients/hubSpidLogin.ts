import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../generated/definitions/hub-spid-login/client";

export const getHubSpidLoginClient = (
  baseUrl: string,
  basePath?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"_____"> =>
  createClient({
    basePath,
    baseUrl,
    fetchApi
  });

export type GetHubSpidLoginClient = typeof getHubSpidLoginClient;
