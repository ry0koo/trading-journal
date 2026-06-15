export interface Trade {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  result: number;
  comment: string;
  beforeImage?: string;
  afterImage?: string;
  tradeDate?: string;
  session?: string;
  createdAt: string;
}