const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// drizzle-orm's ESM build crashes on Hermes with "Cannot read property 'prototype' of undefined"
// when Metro resolves package exports (drizzle-team/drizzle-orm#5736). Force its CommonJS build.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'drizzle-orm' || moduleName.startsWith('drizzle-orm/')) {
    const cjsContext = { ...context, unstable_conditionNames: ['require', 'default'] };
    return (defaultResolveRequest ?? context.resolveRequest)(cjsContext, moduleName, platform);
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
