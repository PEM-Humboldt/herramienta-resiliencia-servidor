const { spawn } = require("child_process");
const { readdir } = require("fs/promises");
const { dbf2oracle } = require("./dbf2oracle");

const logger = require("./logger");

const upload_layer = async (folder, module, srid) => {
  const { DB_SYSTEM } = process.env;
  if (DB_SYSTEM == "oracle") {
    await upload_to_oracle(folder, module);
  } else {
    await upload_to_postgis(folder, module, srid);
  }
};

const upload_to_oracle = async (folder, module) => {
  let dbf_file = "";

  try {
    const files = await readdir(folder);
    dbf_file = files.find((file) => file.endsWith(".dbf"));
  } catch (error) {
    const err = new Error(`Ocurrió un error: ${error}`);
    err.code = "INTERNAL_ERROR";
    throw err;
  }

  let dbfPath = `${folder}/${dbf_file}`;
  await dbf2oracle(dbfPath, module);
};

const upload_to_postgis = async (folder, module, srid) => {
  let shp_file = "";

  try {
    const files = await readdir(folder);
    shp_file = files.find((file) => file.endsWith(".shp"));
  } catch (error) {
    const err = new Error(`Ocurrió un error: ${error}`);
    err.code = "INTERNAL_ERROR";
    throw err;
  }

  const { PG_HOST, DB_USER, DB_NAME, DB_PASSWORD, PG_PORT } = process.env;

  logger.info(
    `shp2pgsql -d -D -s ${srid} -I ${folder}/${shp_file} public.${module} | PGPASSWORD=### psql -h ${PG_HOST} -p ${PG_PORT} -U ${DB_USER} -d ${DB_NAME}`
  );
  return new Promise((res, rej) => {
    const unzip = spawn("sh", [
      "-c",
      `shp2pgsql -d -D -s ${srid} -I ${folder}/${shp_file} public.${module} | PGPASSWORD=${DB_PASSWORD} psql -h ${PG_HOST} -p ${PG_PORT} -U ${DB_USER} -d ${DB_NAME}`,
    ]);

    unzip.stdout.on("data", (data) => {
      logger.info(`stdout: ${data}`);
    });

    unzip.stderr.on("data", (data) => {
      logger.error(`stderr: ${data}`);
    });

    unzip.on("close", (code) => {
      drop_geom(module);
      logger.info(`Capa cargada. Código ${code}`);
      if (code === 0) {
        res();
      } else {
        rej("Carga de capa fallida, ver logs para más información");
      }
    });
  });
};

const drop_geom = async (table) => {
  const { PG_HOST, DB_USER, DB_NAME, DB_PASSWORD, PG_PORT } = process.env;
  logger.info(
    `Dropping geom column from public.${table} | PGPASSWORD=### psql -h ${PG_HOST} -p ${PG_PORT} -U ${DB_USER} -d ${DB_NAME}`
  );
  return new Promise((res, rej) => {
    const unzip = spawn("sh", [
      "-c",
      `PGPASSWORD=${DB_PASSWORD} psql -h ${PG_HOST} -p ${PG_PORT} -U ${DB_USER} -d ${DB_NAME} -c 'ALTER table public.${table} DROP COLUMN geom'`,
    ]);

    unzip.stdout.on("data", (data) => {
      logger.info(`stdout: ${data}`);
    });

    unzip.stderr.on("data", (data) => {
      logger.error(`stderr: ${data}`);
    });

    unzip.on("close", (code) => {
      logger.info(`child process exited with code ${code}`);
      if (code === 0) {
        res();
      } else {
        rej("Hubo un fallo en la base de datos, ver logs para más información");
      }
    });
  });
};

module.exports = { upload_layer };
