import { ExchangeJwtPayloadExtended } from "../middlewares/exchange-jwt-validation-middleware";
import { HslJwtPayloadExtended } from "../middlewares/hsl-jwt-validation-middleware";

export enum TokenTypes {
  EXCHANGE = "exchange"
}

export const isExchangeToken = (
  token: ExchangeJwtPayloadExtended | HslJwtPayloadExtended
): boolean =>
  ExchangeJwtPayloadExtended.is(token) &&
  token.token_type === TokenTypes.EXCHANGE;
