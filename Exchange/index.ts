import { AzureFunction, Context } from "@azure/functions";
import * as express from "express";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { getConfigOrThrow } from "../utils/config";
import { exchangeToken } from "./handler";

const config = getConfigOrThrow();

const app = express();
secureExpressApp(app);

app.post("/api/v1/exchange", exchangeToken(config));

const azureFunctionHandler = createAzureFunctionHandler(app);

const Exchange: AzureFunction = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default Exchange;
