import configDev from './dev';
import configProd from './prod';

const config = (process.env.APP_DEV) ? configDev : configProd;

export default config;