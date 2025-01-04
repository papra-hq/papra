export type Invoice = {
  id: string;
  amountDue: number;
  createdAt: Date;
  pdfUrl: string;
  status: string;
};
