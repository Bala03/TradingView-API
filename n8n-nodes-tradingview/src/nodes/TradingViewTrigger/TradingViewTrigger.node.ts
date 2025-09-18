import type { IWebhookFunctions, INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class TradingViewTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'TradingView Trigger',
    name: 'tradingViewTrigger',
    icon: 'file:tradingview.svg',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow on TradingView webhook events',
    defaults: { name: 'TradingView Trigger' },
    inputs: [],
    outputs: [NodeConnectionType.Main],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: '={{$parameter["path"]}}',
      },
    ],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: 'tradingview',
        description: 'Unique path segment for the webhook',
      },
      {
        displayName: 'Require Secret',
        name: 'requireSecret',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Secret Source',
        name: 'secretSource',
        type: 'options',
        default: 'body',
        options: [
          { name: 'Body JSON Field', value: 'body' },
          { name: 'Header', value: 'header' },
        ],
        displayOptions: { show: { requireSecret: [true] } },
      },
      {
        displayName: 'Secret Field Name',
        name: 'secretField',
        type: 'string',
        default: 'secret',
        displayOptions: { show: { requireSecret: [true], secretSource: ['body'] } },
      },
      {
        displayName: 'Secret Header Name',
        name: 'secretHeader',
        type: 'string',
        default: 'x-tradingview-secret',
        displayOptions: { show: { requireSecret: [true], secretSource: ['header'] } },
      },
      {
        displayName: 'Secret Value',
        name: 'secretValue',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        displayOptions: { show: { requireSecret: [true] } },
      },
      {
        displayName: 'Respond With',
        name: 'response',
        type: 'string',
        default: 'ok',
        description: 'Response body returned to TradingView',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const res = this.getResponseObject();

    const requireSecret = this.getNodeParameter('requireSecret', false) as boolean;
    if (requireSecret) {
      const secretSource = this.getNodeParameter('secretSource') as string;
      const expected = this.getNodeParameter('secretValue') as string;
      let provided = '';
      if (secretSource === 'body') {
        const field = this.getNodeParameter('secretField') as string;
        provided = (req.body?.[field] as string) || '';
      } else {
        const header = (this.getNodeParameter('secretHeader') as string).toLowerCase();
        provided = (req.headers?.[header] as string) || '';
      }
      if (!expected || provided !== expected) {
        res.status(401).json({ ok: false, error: 'Unauthorized' });
        return { noWebhookResponse: true };
      }
    }

    const responseBody = this.getNodeParameter('response') as string;
    try {
      res.status(200).send(responseBody);
    } catch (err) {
      throw new NodeOperationError(this.getNode(), 'Failed to send response');
    }

    const body = req.body ?? {};
    const headers = req.headers ?? {};

    return {
      workflowData: [
        [{ json: { body, headers } }],
      ],
    };
  }
}

