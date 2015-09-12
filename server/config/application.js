import configDev from './dev';
import configProd from './prod';

const config = (process.env.NODE_ENV === 'development') ? configDev : configProd;

export default config;
