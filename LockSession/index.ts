import { AzureFunction, Context } from "@azure/functions";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import * as express from "express";
import { getFastLoginClient } from "../clients/fastLoginClient";
import { getConfigOrThrow } from "../utils/config";
import { getLockSessionHandler } from "./handler";

const config = getConfigOrThrow();

const app = express();
secureExpressApp(app);

app.post(
  "/api/v1/lock-session",
  getLockSessionHandler(
    getFastLoginClient(
      config.FAST_LOGIN_API_KEY,
      config.FAST_LOGIN_CLIENT_BASE_URL
    ),
    config
  )
);

const azureFunctionHandler = createAzureFunctionHandler(app);

const LockSession: AzureFunction = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default LockSession;
