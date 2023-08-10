import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  FastLoginClientConfig,
  HSLConfig,
  IConfig,
  JWTConfig
} from "../utils/config";
import { FeatureFlagEnum } from "../utils/featureFlags/featureFlags";

const iconfig = {
  AzureWebJobsStorage: "azureWebJobsStorage" as NonEmptyString,
  BETA_TESTERS: ["ISPXNB32R82Y766D"],
  COSMOSDB_KEY: "cosmosdbKey" as NonEmptyString,
  COSMOSDB_NAME: "cosmosdbName" as NonEmptyString,
  COSMOSDB_URI: "cosmosdbUri" as NonEmptyString,
  FF_API_ENABLED: FeatureFlagEnum.ALL,
  QueueStorageConnection: "queueStorageConnection" as NonEmptyString,
  isProduction: false
};

export const jwtConfig: JWTConfig = {
  BEARER_AUTH_HEADER: "authorization" as NonEmptyString,
  HUB_SPID_LOGIN_JWT_ISSUER: "SPID" as NonEmptyString,
  HUB_SPID_LOGIN_JWT_PUB_KEY: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhn/zS3oYEUORgxbWCp4V\nQomR4io5g/GLKkZi0pfjSFElIFmfoSnsztEJP1OxC7SSGiJjbozvVIRvH/2icpj9\nwSR86Er2f+yvmvKA6fQ1PMsVEfnsyvfkDUIurpzCksSp3kR0IUgIiZaLcAGfig7q\nSlJEXUb4AKdMSnzqq9QIUNRSb+s34lF9yiuced0HypiQKmf8652aC45RBB3uhhIk\nB2P7tTE3exLyHJQlg52Nzm0ZEMpEB4mqeQLUKWxnF0GqejVVvAUC8i6iJ7hPQgS9\n5qKgSl8qk0ATYruXgH6MdAYMiQkCDCDdo+fRwy2gEmjA9uvNaUHo3gAxCcP6717n\nZwIDAQAB\n-----END PUBLIC KEY-----" as NonEmptyString,
  ISSUER: "PAGOPA" as NonEmptyString,
  JWT_TTL: 900,
  PRIMARY_PRIVATE_KEY: "primaryPrivateKey" as NonEmptyString,
  PRIMARY_PUBLIC_KEY: "primaryPublicKey" as NonEmptyString
};

export const hslConfig: HSLConfig = {
  HUB_SPID_LOGIN_MOCK_TOKEN: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS1pZC1mb3IteW91ci1qd3Qta2V5In0.eyJlbWFpbCI6ImNpdHRhZGluYW56YWRpZ2l0YWxlQHRlYW1kaWdpdGFsZS5nb3Zlcm5vLml0IiwiZmFtaWx5X25hbWUiOiJSb3NzaSIsImZpc2NhbF9udW1iZXIiOiJJU1BYTkIzMlI4Mlk3NjZEIiwibmFtZSI6IkNhcmxhIiwic3BpZF9sZXZlbCI6Imh0dHBzOi8vd3d3LnNwaWQuZ292Lml0L1NwaWRMMSIsImZyb21fYWEiOmZhbHNlLCJsZXZlbCI6IkwyIiwiaWF0IjoxNjkxNjc4ODQ3LCJleHAiOjE2OTE2ODI0NDcsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0IiwiaXNzIjoiU1BJRCIsImp0aSI6Il80NTdhZDI3ZjNkYmMxYzU1YjhkMyJ9.BYv2ib57rcbV1qSftYIjHzstTJ0fyOSjG0MG8J1M5KakwiFyVx-g8_LebzuLfTP0Te6KmAq60tG6DgRxZKbimpaLgqmVOvdWc3tbTbVNUA0NVqS_da0KbXXPoRZLTHXHeIIDk3h_oEWiWm2dsH4yFxkkfxZ20RzsvRHq23no2Q7taZOp57HvPql2kiJ87eTHrsgUQp4ioD22NnLrwuldElKyR1erp5GpnKEYSXl_4oI50PmIpjAm_iR0JSA1sjftSeP2CUNwwoYfR51jWLP6RZzse424eFtC8XagwUP04VC9t4oJWIBEoX9eaVFiMest44G_c5hd6FrOdtnQuh7Kuw" as NonEmptyString,
  HUB_SPID_LOGIN_API_KEY: "hslApiKey" as NonEmptyString,
  HUB_SPID_LOGIN_CLIENT_BASE_URL: "http://localhost:9090" as NonEmptyString
};
export const fastLoginClientConfig: FastLoginClientConfig = {
  FAST_LOGIN_API_KEY: "fastLoginApiKey" as NonEmptyString,
  FAST_LOGIN_CLIENT_BASE_URL: "fastLoginClientBaseUrl" as NonEmptyString
};

export const config: IConfig = {
  ...iconfig,
  ...jwtConfig,
  ...fastLoginClientConfig,
  ...hslConfig
};
