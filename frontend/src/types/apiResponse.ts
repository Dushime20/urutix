export interface IResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: Date;
}

export interface IPaginatorResponse<T> {
  results: T[];
  total: number;
  start: number;
  end: number;
  size: number;
}

export interface IPaginatedRes<T> extends IResponse<IPaginatorResponse<T>> {}
