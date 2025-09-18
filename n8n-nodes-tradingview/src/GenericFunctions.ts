import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { IExecuteFunctions, ILoadOptionsFunctions, IWebhookFunctions, IDataObject, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type ThisContext = IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions;

export interface RequestOptions {
  timeoutMs?: number;
  responseType?: 'json' | 'arraybuffer' | 'text';
  headers?: Record<string, string>;
  retry?: {
    maxAttempts: number;
    baseDelayMs: number;
  };
}

export async function tradingViewApiRequest(
  this: ThisContext,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  options: RequestOptions = {},
): Promise<any> {
  const credentials = await this.getCredentials('tradingViewApi');

  const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
  const url = /^https?:\/\//i.test(endpoint) ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json, */*;q=0.8',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Auth modes
  const authMode = credentials.authMode as string;
  if (authMode === 'apiKey') {
    const apiKeyHeader = (credentials.apiKeyHeader as string) || 'Authorization';
    headers[apiKeyHeader] = String(credentials.apiKey || '');
  } else if (authMode === 'bearerToken') {
    headers.Authorization = `Bearer ${credentials.accessToken}`;
  } else if (authMode === 'basic') {
    const username = String(credentials.username || '');
    const password = String(credentials.password || '');
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    headers.Authorization = `Basic ${encoded}`;
  } else if (authMode === 'cookie') {
    headers.Cookie = String(credentials.cookie || '');
  } else if (authMode === 'customHeaders') {
    const additional = (credentials.additionalHeaders as IDataObject[]) || [];
    for (const kv of additional) {
      if (kv && kv.key && kv.value) headers[String(kv.key)] = String(kv.value);
    }
  }

  const timeout = options.timeoutMs ?? 30000;
  const responseType = options.responseType ?? 'json';
  const axiosConfig: AxiosRequestConfig = {
    url,
    method: method as any,
    headers,
    params: qs as JsonObject,
    timeout,
    responseType: responseType === 'arraybuffer' ? 'arraybuffer' : responseType === 'text' ? 'text' : 'json',
    validateStatus: (status) => status >= 200 && status < 300,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    axiosConfig.data = body;
  }

  const retry = options.retry ?? { maxAttempts: 3, baseDelayMs: 500 };
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const response = await axios(axiosConfig);
      return response.data;
    } catch (error) {
      const e = error as AxiosError;
      const status = e.response?.status ?? 0;
      const shouldRetry = status === 429 || status >= 500 || e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET';
      if (!shouldRetry || attempt >= retry.maxAttempts - 1) {
        const errorData = {
          message: e.message,
          status,
          url: (e.config as AxiosRequestConfig)?.url,
          method: (e.config as AxiosRequestConfig)?.method,
          data: e.response?.data,
        } as any;
        throw new NodeApiError(this.getNode(), errorData);
      }
      const delay = retry.baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }
}

export async function tradingViewApiRequestAllItemsByOffset(
  this: ThisContext,
  method: string,
  endpoint: string,
  body: IDataObject,
  qs: IDataObject,
  options: RequestOptions & {
    offsetParam: string;
    limitParam: string;
    limitPerPage: number;
    maxItems?: number;
    dataPropertyName?: string; // if set, extract array from response[dataPropertyName]
  },
): Promise<IDataObject[]> {
  const results: IDataObject[] = [];
  let offset = Number(qs[options.offsetParam] ?? 0);
  const limitPerPage = options.limitPerPage;
  const maxItems = options.maxItems ?? Number.POSITIVE_INFINITY;
  const dataProp = options.dataPropertyName || '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pageQs = { ...qs, [options.offsetParam]: offset, [options.limitParam]: limitPerPage } as IDataObject;
    const response = await tradingViewApiRequest.call(this, method, endpoint, body, pageQs, options);
    const pageItems: unknown = dataProp ? (response?.[dataProp as keyof typeof response] as unknown) : response;
    if (!Array.isArray(pageItems)) {
      // When not an array, push raw response once and exit
      if (results.length === 0) {
        results.push(response as IDataObject);
      }
      break;
    }
    results.push(...(pageItems as IDataObject[]));
    if (pageItems.length < limitPerPage || results.length >= maxItems) break;
    offset += limitPerPage;
  }

  if (results.length > maxItems) {
    return results.slice(0, maxItems);
  }
  return results;
}

