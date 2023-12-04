import type { AxiosResponse } from 'axios';

export interface IResponse<T = any> {
  request: Promise<AxiosResponse<T>>;
  controller: AbortController;
}

export interface IResponseBody {
  status: string;
  code: number;
  page: number;
  limit: number;
  total_results: number;
  results: any;
  filter_options: any;
}
