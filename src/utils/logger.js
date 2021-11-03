const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');

let log = null;

fs.access('logs/', err => {
  if (err) {
    fs.mkdir('logs/', () => { });
  }
});

const transport = new (winston.transports.DailyRotateFile)({
  filename: 'logs/bm_models_info-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '50m',
  timestamp: true
});

const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}] ${message}`;
});

if (!log) {
  log = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      myFormat
    ),
    transports: [
      new winston.transports.Console({
        level: 'info',
        timestamp: true
      }),
      transport,
    ]
  });
}
module.exports = log;
