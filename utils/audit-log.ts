import { createHash } from "crypto";
import { randomBytes } from "crypto";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import {
  BlockBlobUploadResponse,
  ContainerClient,
  RestError
} from "@azure/storage-blob";
import { FiscalCode, IPString } from "@pagopa/ts-commons/lib/strings";
import { left } from "fp-ts/lib/Either";
import { TokenTypes } from "./enums/TokenTypes";

/**
 * File name pattern "${hash(CF)}-${UTCDateTime}-tokentype-IdToken-randomBytes(3)".
 *
 * @param fiscal_number User Fiscal Number
 * @param token_type Token Type
 * @param token_id Token ID
 * @returns File Name
 */

export const generateBlobName = (
  fiscal_number: FiscalCode,
  token_type: TokenTypes,
  token_id: string
): string => {
  const UTCDateTime = new Date().toISOString();
  const hash = createHash("md5")
    .update(fiscal_number)
    .digest("hex");
  const randomBytesPart = randomBytes(3).toString("hex");
  return `${hash}-${UTCDateTime}-${token_type}-${token_id}-${randomBytesPart}`;
};

const AuditExchangeDoc = t.type({
  ip: IPString,
  tokenId: t.string,
  tokenIssuingTime: t.string
});

const AuditLogTags = t.type({
  DateTime: t.string,
  FatherIDToken: t.string,
  FiscalCode,
  IDToken: t.string,
  Type: t.keyof({ [TokenTypes.EXCHANGE]: null })
});

export type AuditExchangeDoc = t.TypeOf<typeof AuditExchangeDoc>;
export type AuditLogTags = t.TypeOf<typeof AuditLogTags>;

export const checkContainerExists = (
  containerClient: ContainerClient
): TE.TaskEither<RestError, boolean> =>
  TE.tryCatch(
    () => containerClient.exists(),
    err => (err instanceof RestError ? err : new RestError(String(err)))
  );

export const uploadContent = (
  containerClient: ContainerClient,
  auditLogDoc: AuditExchangeDoc,
  tags: AuditLogTags
): TE.TaskEither<RestError, BlockBlobUploadResponse> =>
  TE.tryCatch(
    () => {
      const content = JSON.stringify(AuditExchangeDoc.encode(auditLogDoc));

      const blockBlobClient = containerClient.getBlockBlobClient(
        generateBlobName(tags.FiscalCode, tags.Type, tags.IDToken)
      );

      return blockBlobClient.upload(content, content.length, { tags });
    },
    err => (err instanceof RestError ? err : new RestError(String(err)))
  );

export const storeAuditLog: (
  containerClient: ContainerClient,
  auditLogDoc: AuditExchangeDoc,
  tags: AuditLogTags
) => TE.TaskEither<RestError, BlockBlobUploadResponse> = (
  containerClient: ContainerClient,
  auditLogDoc: AuditExchangeDoc,
  tags: AuditLogTags
) =>
  pipe(
    checkContainerExists(containerClient),
    TE.chain(exists =>
      exists
        ? uploadContent(containerClient, auditLogDoc, tags)
        : TE.fromEither(left(new RestError("Container does not exist")))
    )
  );
