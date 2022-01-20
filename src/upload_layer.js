const { spawn } = require('child_process');
const { readdir } = require('fs/promises');

const logger = require('./utils/logger');

module.exports = async (folder, layer, srid) => {
  let shp_file = ''
  try {
    const files = await readdir(folder);
    shp_file = files.find(file => file.endsWith('.shp'))
  } catch (error) {
    const err = new Error(`Ocurrió un error: ${error}`);
    err.code = 'INTERNAL_ERROR';
    throw err;
  }

  const {PG_HOST, PG_USER, PG_DATABASE, PG_PASSWORD, PG_PORT} = process.env;
  logger.info(`shp2pgsql -c -D -s ${srid} -I ${folder}/${shp_file} public.${layer} | PGPASSWORD=${PG_PASSWORD} psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE}`)
  return new Promise((res, rej) => {
    const unzip = spawn('sh', [
      '-c',
      `shp2pgsql -c -D -s ${srid} -I ${folder}/${shp_file} public.${layer} | PGPASSWORD=${PG_PASSWORD} psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE}`
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
        res();
      } else {
        rej('Carga de capa fallida, ver logs para más información');
      }
    });
  });
};
