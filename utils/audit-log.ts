import { randomBytes } from "crypto";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import {
  BlockBlobUploadResponse,
  ContainerClient,
  RestError
} from "@azure/storage-blob";
import { enumType } from "@pagopa/ts-commons/lib/types";
import { OperationTypes } from "./enums/OperationTypes";

/**
 * File name pattern "${hash(CF)}-${UTCDateTime}-tokentype-IdToken-randomBytes(3)".
 *
 * @param fiscal_number User Fiscal Number
 * @param token_type Token Type
 * @param token_id Token ID
 * @returns File Name
 */

export const generateBlobName = (
  fiscal_number_hashed: string,
  token_type: OperationTypes,
  token_id: string
): string => {
  const UTCDateTime = new Date().toISOString();
  const randomBytesPart = randomBytes(3).toString("hex");
  return `${fiscal_number_hashed}-${UTCDateTime}-${token_type}-${token_id}-${randomBytesPart}`;
};

const AuditExchangeDoc = t.type({
  fatherTokenId: t.string,
  ip: t.string,
  tokenIssuingTime: t.string
});

const AuditActionDoc = t.type({
  family_name: t.string,
  fiscal_number: t.string,
  ip: t.string,
  name: t.string
});

const BaseAuditLogTags = t.type({
  DateTime: t.string,
  FiscalCode: t.string,
  IDToken: t.string,
  Type: enumType(OperationTypes, "operationType")
});

const FatherIDTokenAuditLogTags = t.intersection([
  BaseAuditLogTags,
  t.type({ FatherIDToken: t.string })
]);

const IpAuditLogTags = t.intersection([
  BaseAuditLogTags,
  t.type({ Ip: t.string })
]);

const AuditLogTags = t.union([FatherIDTokenAuditLogTags, IpAuditLogTags]);

export type AuditExchangeDoc = t.TypeOf<typeof AuditExchangeDoc>;
export type AuditLogTags = t.TypeOf<typeof AuditLogTags>;
export type AuditActionDoc = t.TypeOf<typeof AuditActionDoc>;

const encodeAuditLogDoc = (doc: AuditExchangeDoc | AuditActionDoc): string => {
  if (AuditExchangeDoc.is(doc)) {
    return JSON.stringify(AuditExchangeDoc.encode(doc));
  } else if (AuditActionDoc.is(doc)) {
    return JSON.stringify(AuditActionDoc.encode(doc));
  } else {
    throw new Error("Invalid type");
  }
};

export const storeAuditLog = (
  containerClient: ContainerClient,
  auditLogDoc: AuditExchangeDoc | AuditActionDoc,
  tags: AuditLogTags
): TE.TaskEither<RestError, BlockBlobUploadResponse> =>
  TE.tryCatch(
    () => {
      const content = encodeAuditLogDoc(auditLogDoc);
      const blockBlobClient = containerClient.getBlockBlobClient(
        generateBlobName(tags.FiscalCode, tags.Type, tags.IDToken)
      );
      return blockBlobClient.upload(content, content.length, { tags });
    },
    err => (err instanceof RestError ? err : new RestError(String(err)))
  );
