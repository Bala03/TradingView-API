import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TradingViewApi implements ICredentialType {
  name = 'tradingViewApi';
  displayName = 'TradingView API';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.example.com',
      required: true,
    },
    {
      displayName: 'Auth Mode',
      name: 'authMode',
      type: 'options',
      default: 'none',
      options: [
        { name: 'None', value: 'none' },
        { name: 'API Key (Custom Header)', value: 'apiKey' },
        { name: 'Bearer Token', value: 'bearerToken' },
        { name: 'Basic', value: 'basic' },
        { name: 'Cookie', value: 'cookie' },
        { name: 'Custom Headers', value: 'customHeaders' },
      ],
    },
    {
      displayName: 'API Key Header',
      name: 'apiKeyHeader',
      type: 'string',
      default: 'Authorization',
      displayOptions: {
        show: {
          authMode: ['apiKey'],
        },
      },
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        show: {
          authMode: ['apiKey'],
        },
      },
    },
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        show: {
          authMode: ['bearerToken'],
        },
      },
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authMode: ['basic'],
        },
      },
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        show: {
          authMode: ['basic'],
        },
      },
    },
    {
      displayName: 'Cookie',
      name: 'cookie',
      type: 'string',
      default: '',
      description: 'Cookie header value (e.g., key=value; key2=value2)',
      displayOptions: {
        show: {
          authMode: ['cookie'],
        },
      },
    },
    {
      displayName: 'Additional Headers',
      name: 'additionalHeaders',
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
            {
              displayName: 'Key',
              name: 'key',
              type: 'string',
              default: '',
            },
            {
              displayName: 'Value',
              name: 'value',
              type: 'string',
              default: '',
            },
          ],
        },
      ],
      displayOptions: {
        show: {
          authMode: ['customHeaders'],
        },
      },
    },
  ];
}

