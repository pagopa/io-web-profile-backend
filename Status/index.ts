import { AzureFunction, Context } from "@azure/functions";
import * as express from "express";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { checkWhiteListMiddleware } from "../utils/whiteListMiddleware";

const app = express();
secureExpressApp(app);

app.use(checkWhiteListMiddleware);

app.get("/api/v1/status", (req, res) => {
  res.status(200).json({ message: "Service is running" });
});

const azureFunctionHandler = createAzureFunctionHandler(app);

const httpStatus: AzureFunction = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default httpStatus;
