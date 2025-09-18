import type { IExecuteFunctions, IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { tradingViewApiRequest, tradingViewApiRequestAllItemsByOffset } from '../../GenericFunctions';

export class TradingView implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'TradingView',
    name: 'tradingView',
    icon: 'file:tradingview.svg',
    group: ['transform'],
    version: 1,
    description: 'Interact with TradingView-compatible REST endpoints',
    defaults: {
      name: 'TradingView',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'tradingViewApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Raw Request', value: 'rawRequest' },
        ],
        default: 'rawRequest',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'GET', value: 'get' },
          { name: 'POST', value: 'post' },
          { name: 'PUT', value: 'put' },
          { name: 'PATCH', value: 'patch' },
          { name: 'DELETE', value: 'delete' },
        ],
        default: 'get',
      },
      {
        displayName: 'Endpoint',
        name: 'endpoint',
        type: 'string',
        default: '/',
        description: 'Path appended to Base URL, or absolute URL',
      },
      {
        displayName: 'Query Parameters',
        name: 'queryParameters',
        placeholder: 'Add Parameter',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Parameter',
            values: [
              { displayName: 'Name', name: 'name', type: 'string', default: '' },
              { displayName: 'Value', name: 'value', type: 'string', default: '' },
            ],
          },
        ],
      },
      {
        displayName: 'Headers',
        name: 'headers',
        placeholder: 'Add Header',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'header',
            displayName: 'Header',
            values: [
              { displayName: 'Name', name: 'name', type: 'string', default: '' },
              { displayName: 'Value', name: 'value', type: 'string', default: '' },
            ],
          },
        ],
      },
      {
        displayName: 'Body Content Type',
        name: 'bodyContentType',
        type: 'options',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'Form-URL Encoded', value: 'formUrlEncoded' },
          { name: 'Raw Text', value: 'raw' },
        ],
        default: 'json',
        displayOptions: {
          show: {
            operation: ['post', 'put', 'patch', 'delete'],
          },
        },
      },
      {
        displayName: 'Body Parameters',
        name: 'bodyParametersJson',
        type: 'json',
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: '{}',
        displayOptions: {
          show: {
            operation: ['post', 'put', 'patch', 'delete'],
            bodyContentType: ['json'],
          },
        },
      },
      {
        displayName: 'Body (Raw)',
        name: 'bodyRaw',
        type: 'string',
        typeOptions: { alwaysOpenEditWindow: true },
        default: '',
        displayOptions: {
          show: {
            operation: ['post', 'put', 'patch', 'delete'],
            bodyContentType: ['raw'],
          },
        },
      },
      {
        displayName: 'Form Fields',
        name: 'formFields',
        placeholder: 'Add Field',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'field',
            displayName: 'Field',
            values: [
              { displayName: 'Name', name: 'name', type: 'string', default: '' },
              { displayName: 'Value', name: 'value', type: 'string', default: '' },
            ],
          },
        ],
        displayOptions: {
          show: {
            operation: ['post', 'put', 'patch', 'delete'],
            bodyContentType: ['formUrlEncoded'],
          },
        },
      },
      {
        displayName: 'Pagination',
        name: 'pagination',
        type: 'boolean',
        default: false,
        description: 'Enable offset-based pagination',
      },
      {
        displayName: 'Offset Param',
        name: 'offsetParam',
        type: 'string',
        default: 'offset',
        displayOptions: {
          show: {
            pagination: [true],
          },
        },
      },
      {
        displayName: 'Limit Param',
        name: 'limitParam',
        type: 'string',
        default: 'limit',
        displayOptions: {
          show: {
            pagination: [true],
          },
        },
      },
      {
        displayName: 'Items per Page',
        name: 'limitPerPage',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 50,
        displayOptions: {
          show: {
            pagination: [true],
          },
        },
      },
      {
        displayName: 'Max Items',
        name: 'maxItems',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 0,
        description: '0 means unlimited',
        displayOptions: {
          show: {
            pagination: [true],
          },
        },
      },
      {
        displayName: 'Data Property (Optional)',
        name: 'dataPropertyName',
        type: 'string',
        default: '',
        description: 'If response is an object with array at this path',
        displayOptions: {
          show: {
            pagination: [true],
          },
        },
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        default: {},
        options: [
          {
            displayName: 'Timeout (ms)',
            name: 'timeoutMs',
            type: 'number',
            default: 30000,
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const operation = this.getNodeParameter('operation', 0) as string;
    const endpoint = this.getNodeParameter('endpoint', 0) as string;
    const pagination = this.getNodeParameter('pagination', 0, false) as boolean;
    const additionalOptions = this.getNodeParameter('additionalOptions', 0, {}) as IDataObject;

    const headersUi = (this.getNodeParameter('headers', 0, {}) as IDataObject).header as IDataObject[] | undefined;
    const queryUi = (this.getNodeParameter('queryParameters', 0, {}) as IDataObject).parameter as IDataObject[] | undefined;

    const headers: IDataObject = {};
    if (headersUi) for (const h of headersUi) if (h.name) headers[String(h.name)] = String(h.value ?? '');
    const qs: IDataObject = {};
    if (queryUi) for (const q of queryUi) if (q.name) qs[String(q.name)] = String(q.value ?? '');

    let body: IDataObject | string = {};
    if (operation !== 'get') {
      const bodyType = this.getNodeParameter('bodyContentType', 0, 'json') as string;
      if (bodyType === 'json') {
        const json = this.getNodeParameter('bodyParametersJson', 0, '{}') as string;
        try {
          body = JSON.parse(json || '{}') as IDataObject;
        } catch (err) {
          throw new NodeOperationError(this.getNode(), 'Invalid JSON in Body Parameters');
        }
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
      } else if (bodyType === 'formUrlEncoded') {
        const formFields = (this.getNodeParameter('formFields', 0, {}) as IDataObject).field as IDataObject[] | undefined;
        const params = new URLSearchParams();
        if (formFields) {
          for (const f of formFields) if (f.name) params.append(String(f.name), String(f.value ?? ''));
        }
        body = params.toString();
        (headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        body = this.getNodeParameter('bodyRaw', 0, '') as string;
        (headers as Record<string, string>)['Content-Type'] = 'text/plain';
      }
    }

    const timeoutMs = (additionalOptions.timeoutMs as number) || 30000;

    const methodMap: Record<string, string> = {
      get: 'GET',
      post: 'POST',
      put: 'PUT',
      patch: 'PATCH',
      delete: 'DELETE',
    };
    const method = methodMap[operation] || 'GET';

    if (pagination) {
      const offsetParam = this.getNodeParameter('offsetParam', 0) as string;
      const limitParam = this.getNodeParameter('limitParam', 0) as string;
      const limitPerPage = this.getNodeParameter('limitPerPage', 0) as number;
      const maxItems = this.getNodeParameter('maxItems', 0) as number;
      const dataPropertyName = this.getNodeParameter('dataPropertyName', 0, '') as string;

      const allItems = await tradingViewApiRequestAllItemsByOffset.call(
        this,
        method,
        endpoint,
        (typeof body === 'string' ? {} : body) as IDataObject,
        qs,
        {
          timeoutMs,
          offsetParam,
          limitParam,
          limitPerPage,
          maxItems: maxItems && maxItems > 0 ? maxItems : undefined,
          dataPropertyName: dataPropertyName || undefined,
        },
      );
      for (const r of allItems) returnData.push({ json: r });
    } else {
      const response = await tradingViewApiRequest.call(
        this,
        method,
        endpoint,
        (typeof body === 'string' ? { raw: body } : body) as IDataObject,
        qs,
        { timeoutMs },
      );
      returnData.push({ json: response });
    }

    return [returnData];
  }
}

