#!/bin/bash
# Quick ESLint fixes for new files

echo "Applying ESLint fixes..."

# Fix robustHttpClient.js
sed -i 's/Math\.pow(2, attempt)/2 ** attempt/g' src/robustHttpClient.js
sed -i 's/attempt++/attempt += 1/g' src/robustHttpClient.js
sed -i 's/i++/i += 1/g' src/robustHttpClient.js
sed -i 's/parseInt(retryAfter)/parseInt(retryAfter, 10)/g' src/robustHttpClient.js

# Fix marketDataApi.js - make static methods static
sed -i 's/getAvailableMarkets()/static getAvailableMarkets()/g' src/marketDataApi.js
sed -i 's/getAvailableColumns()/static getAvailableColumns()/g' src/marketDataApi.js  
sed -i 's/getFilterOperations()/static getFilterOperations()/g' src/marketDataApi.js
sed -i 's/formatNumber(num)/static formatNumber(num)/g' src/marketDataApi.js

echo "Basic ESLint fixes applied."