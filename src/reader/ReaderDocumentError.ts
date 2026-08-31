import type { ReaderErrorCode } from '@ankhorage/zora';

export class ReaderDocumentError extends Error {
  constructor(
    readonly code: ReaderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReaderDocumentError';
  }
}
