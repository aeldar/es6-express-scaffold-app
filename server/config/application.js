var config;

if (process.env.APP_DEV) {
  config = require('./dev');
}
else {
  config = require('./prod');
}

module.exports = config;