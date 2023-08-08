import { AzureFunction, Context } from "@azure/functions";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import * as express from "express";
import { createClient as externalClient } from "../generated/definitions/external/client";
import { getConfigOrThrow } from "../utils/config";
import { getLockSessionHandler } from "./handler";

const config = getConfigOrThrow();

const app = express();
secureExpressApp(app);

const lockClient = externalClient<"body">({
  baseUrl: "TODO/base/url",
  fetchApi: fetch,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  withDefaults: op => params =>
    op({
      ...params
    })
});

app.post("/api/v1/lock-session", getLockSessionHandler(lockClient, config));

const azureFunctionHandler = createAzureFunctionHandler(app);

const LockSession: AzureFunction = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default LockSession;
