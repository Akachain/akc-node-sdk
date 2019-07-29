'use strict';

let filePath = './logs/';
const log4js = require('log4js');

log4js.configure({
  appenders: {
    everything: {
      type: 'dateFile', filename: `${filePath}logs-all.log`, pattern: '.yyyy-MM-dd', compress: true,
    },
    emergencies: {
      type: 'dateFile', filename: `${filePath}logs-error.log`, pattern: '.yyyy-MM-dd', compress: true,
    },
    information: {
      type: 'dateFile', filename: `${filePath}logs-info.log`, pattern: '.yyyy-MM-dd', compress: true,
    },
    'just-errors': { type: 'logLevelFilter', appender: 'emergencies', level: 'error' },
    'just-info': { type: 'logLevelFilter', appender: 'information', level: 'info' },
    stdout: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['just-errors', 'just-info', 'everything', 'stdout'], level: 'debug' },
  },
});

let logger = log4js.getLogger();
logger.level = 'debug';

/**
 * 
 * @param {string} file_path file path where you want to store logs. Default set to ./logs/
 */
const setFilePath = (file_path) => {
  filePath = file_path;
};

/**
 * 
 * @param {string} moduleName Name of module describes logs
 */
const getLogger = (moduleName) => {
  logger = log4js.getLogger(moduleName);
  logger.level = 'debug';
  return logger;
};

exports.getLogger = getLogger;
exports.setFilePath = setFilePath;
