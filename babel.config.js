module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Lets `import sql from './0000_x.sql'` inline the file so Drizzle migrations ship in the bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
