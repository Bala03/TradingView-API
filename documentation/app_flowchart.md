flowchart TD
    Start[Start] --> Config[Load Config]
    Config --> SessionManager[Initialize Session Manager]
    SessionManager --> Auth[Authenticate User]
    Auth --> Client[Initialize WebSocket Client]
    Client --> Decision{Select Session Type}
    Decision -->|Chart Session| ChartSession[Create Chart Session]
    ChartSession --> SetSymbol[Set Symbol and Timeframe]
    SetSymbol --> AttachIndicator[Attach Indicators to Chart]
    AttachIndicator --> ChartUpdates[Receive Chart Updates]
    Decision -->|Quote Session| QuoteSession[Create Quote Session]
    QuoteSession --> SubscribePrice[Subscribe to Price Updates]
    SubscribePrice --> QuoteUpdates[Receive Quote Data]
    ChartUpdates --> DataHandling[Handle Data and Events]
    QuoteUpdates --> DataHandling
    DataHandling --> PineControl[Pine Script Control]
    PineControl --> End[End Flow]