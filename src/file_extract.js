const { spawn } = require('child_process');

const logger = require('./utils/logger');

module.exports = (filename) => {
  return new Promise((res, rej) => {
    const unzip = spawn('unzip', [
      '-j',
      '-u',
      `${process.cwd()}/uploads/${filename}.zip`,
      '-d',
      `${process.cwd()}/uploads/${filename}`
    ]);

    unzip.stdout.on('data', (data) => {
      logger.info(`stdout: ${data}`);
    });

    unzip.stderr.on('data', (data) => {
      logger.error(`stderr: ${data}`);
    });

    unzip.on('close', (code) => {
      logger.info(`child process exited with code ${code}`);
      if (code === 0) {
        res(`${process.cwd()}/uploads/${filename}`);
      } else {
        rej('Extracción fallida, ver logs para más información');
      }
    });
  })
};
