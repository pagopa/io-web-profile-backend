import { ExchangeJwtPayloadExtended } from "../middlewares/exchange-jwt-validation-middleware";
import { HslJwtPayloadExtended } from "../middlewares/hsl-jwt-validation-middleware";

export enum TokenTypes {
  EXCHANGE = "exchange",
  MAGIC_LINK = "magic_link"
}
