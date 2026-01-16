const path = require('path');

module.exports = (request, options) => {
  // Intercept expo winter runtime modules
  if (request.includes('expo/src/winter')) {
    return path.resolve(__dirname, '__mocks__/expo-winter.js');
  }
  
  // Use default resolver for everything else
  return options.defaultResolver(request, options);
};
