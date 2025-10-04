const TradingView = require('@mathieuc/tradingview');

module.exports = {
  // Node properties
  name: 'TradingView',
  displayName: 'TradingView',
  description: 'Fetches data from TradingView',
  group: ['transform'],
  version: 1,
  defaults: {
    name: 'TradingView',
    color: '#1A85FF',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'tradingviewApi',
      required: true,
    },
  ],
  properties: [
    {
      displayName: 'Custom JavaScript Code',
      name: 'customCode',
      type: 'string',
      typeOptions: {
        alwaysOpenEditor: true,
      },
      default: '',
      placeholder:
        '// Access the client with `client` and the current item with `item`.\n// The script must return a JSON object.\n// Example:\n// const indicator = await client.getIndicator("STD;Stochastic", "BINANCE:BTCUSDT", "1D");\n// return { stoch: indicator.stoch };',
      description: 'JavaScript code to interact with the TradingView client. The script should be an async function body and return a JSON object. The returned object will be merged with the input item.',
    },
  ],

  // Node execution logic
  async execute() {
    const credentials = await this.getCredentials('tradingviewApi');
    const customCode = this.getNodeParameter('customCode', 0, '');

    if (!customCode) {
      throw new Error('Custom JavaScript code is required.');
    }

    let client;
    try {
      client = new TradingView.Client({
        token: credentials.sessionid,
        signature: credentials.signature,
      });

      const items = this.getInputData();
      const returnData = [];

      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const customFunction = new AsyncFunction('client', 'item', customCode);

      for (let i = 0; i < items.length; i++) {
        try {
          const item = items[i];
          const result = await customFunction(client, item);

          let jsonResult;
          if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            jsonResult = result;
          } else {
            jsonResult = { result: result };
          }

          returnData.push({
            json: { ...item.json, ...jsonResult },
            pairedItem: {
              item: i,
            },
          });
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              json: {
                error: error.message,
              },
              pairedItem: {
                item: i,
              },
            });
            continue;
          }
          throw error;
        }
      }
      return this.prepareOutputData(returnData);
    } finally {
      if (client && client.isOpen) {
        await client.end();
      }
    }
  },
};