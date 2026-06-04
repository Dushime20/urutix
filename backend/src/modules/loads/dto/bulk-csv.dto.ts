export interface CsvLoadRow {
  origin: string;
  destination: string;
  weight: string;
  cargoType: string;
  pickupDate: string;
  deliveryDate: string;
  offeredPrice: string;
  currency: string;
  urgencyLevel: string;
  title?: string;
  description?: string;
}

export interface BulkCsvResult {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  loadIds: string[];
}
