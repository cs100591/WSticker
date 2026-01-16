/**
 * Skip Login Context
 * Provides skip login functionality for development/testing
 */

import React from 'react';

export const SkipLoginContext = React.createContext<{
  skipToMain: () => void;
}>({
  skipToMain: () => {},
});
