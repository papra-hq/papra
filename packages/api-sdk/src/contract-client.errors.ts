export type PapraContractErrorReason =
  | 'undeclared_status'
  | 'undeclared_error'
  | 'invalid_response_json'
  | 'invalid_response_body';

export class PapraContractError extends Error {
  readonly reason: PapraContractErrorReason;
  readonly status: number;
  readonly endpoint: { method: string; path: string };
  readonly response: Response;

  constructor({
    message,
    reason,
    endpoint,
    response,
    cause,
  }: {
    message: string;
    reason: PapraContractErrorReason;
    endpoint: { method: string; path: string };
    response: Response;
    cause?: unknown;
  }) {
    super(message, { cause });

    this.name = 'PapraContractError';
    this.reason = reason;
    this.status = response.status;
    this.endpoint = endpoint;
    this.response = response;
  }
}
