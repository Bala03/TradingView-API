module.exports = {
  name: 'TradingView API',
  displayName: 'TradingView API',
  documentationUrl: 'https://github.com/Mathieu2301/TradingView-API',
  properties: [
    {
      displayName: 'Session ID',
      name: 'sessionid',
      type: 'string',
      default: '',
      placeholder: 'your_session_id',
      description: 'Your TradingView session ID.',
    },
    {
      displayName: 'Signature',
      name: 'signature',
      type: 'string',
      default: '',
      placeholder: 'your_signature',
      description: 'Your TradingView session signature.',
    },
  ],
};