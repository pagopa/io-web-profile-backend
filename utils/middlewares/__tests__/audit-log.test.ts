import * as auditLog from '../../audit-log';
import * as handler from '../../audit-log';
import { BlobServiceClient, BlockBlobUploadResponse, ContainerClient, RestError } from '@azure/storage-blob';
import { AuditExchangeDoc, AuditLogTags, generateBlobName, storeAuditLog } from '../../audit-log'; 
import * as TE from "fp-ts/TaskEither";
import { config as mockedConfig } from "../../../__mocks__/config.mock";
import { FiscalCode } from '@pagopa/ts-commons/lib/strings';
import { TokenTypes } from '../../enums/TokenTypes';
import { isLeft, isRight } from 'fp-ts/lib/Either';

const config = { ...mockedConfig }

describe('Audit Logs Utils' , () => {

  const aValidAuditLogDoc: AuditExchangeDoc = {
    ip: '127.0.0.1',
    tokenId: 'token123',
    tokenIssuingTime: '2022-01-01T12:00:00Z',
  };

  const aValidAuditLogTags: AuditLogTags = {
    FatherIDToken: 'parentToken123',
    FiscalCode: '12345678901' as FiscalCode,
    DateTime: '2022-01-01T12:00:00Z',
    IDToken: 'token123',
    Type: 'exchange' as TokenTypes,
  };

  const containerClient = BlobServiceClient.fromConnectionString(
    config.AUDIT_LOG_CONNECTION_STRING
  ).getContainerClient(config.AUDIT_LOG_CONTAINER);

  beforeEach(() => {
    jest.clearAllMocks();
  });

    test('storeAuditLog failed if container not exists', async () => {

        const mockCheckContainerExists = jest
        .spyOn(auditLog, "checkContainerExists")
        .mockReturnValueOnce(TE.right(false));
                  
        const result = await storeAuditLog(containerClient, aValidAuditLogDoc, aValidAuditLogTags)();

        expect(mockCheckContainerExists).toHaveBeenCalledTimes(1);
        expect(isLeft(result)).toBe(true);
    });
    
    test('storeAuditLog success when container exists', async () => {

        const mockCheckContainerExists = jest
        .spyOn(auditLog, "checkContainerExists")
        .mockReturnValueOnce(TE.right(true));
        
        const mockUploadContent = jest
        .spyOn(auditLog, "uploadContent")
        .mockReturnValueOnce(TE.right({} as BlockBlobUploadResponse));
    
            
        const result = await storeAuditLog(containerClient, aValidAuditLogDoc, aValidAuditLogTags)();
        console.log('result', result);
        expect(mockCheckContainerExists).toHaveBeenCalledTimes(1); 
        expect(mockUploadContent).toHaveBeenCalledTimes(1); 

        expect(isRight(result)).toBe(true);
    });
});
