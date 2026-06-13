export interface Trade {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";

  result: number; // теперь это R, а не %

  comment: string;

  beforeImage?: string;
  afterImage?: string;

  createdAt: string;
}