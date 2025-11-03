export type PingResponse = {
  status: 'ok';
  timestamp: number;
};

export type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};
