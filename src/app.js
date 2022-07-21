const express = require("express");
const helmet = require("helmet");

const {
  upload: upload_file,
  extract: extract_file,
  compress: compress_file,
  clear_folder,
} = require("./utils/file_utils");
const { create_workspace, create_datastore } = require("./utils/geoserver");
const { exec_model, upload_params } = require("./model");
const { upload_layer, drop_geom } = require("./utils/database_utils");
const error_handler = require("./utils/error_handler");
const logger = require("./utils/logger");

const app = express();
const port = 3000;

app.use(helmet());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const wrapAsync = (fn) => {
  return (req, res, next) => {
    const fnReturn = fn(req, res, next);
    return Promise.resolve(fnReturn).catch(next);
  };
};

/*
 * In all /upload/* endpoints is important that filedname for the file to be the
 * same as the second part of the path so the error hadler deliver correct messages
 */

app.post(
  "/upload/layer",
  upload_file.single("layer"),
  wrapAsync(async ({ file, body }, res, next) => {
    logger.info(`archivo recibido para carga de capa: ${JSON.stringify(file)}`);
    const fields = ["srid", "module"];
    missing = fields.filter((field) => !(field in body));
    if (missing.length > 0) {
      const error = new Error("Hay campos faltantes");
      error.code = "MISSING_FORM_FIELDS";
      error.fields = missing.join(", ");
      throw error;
    }
    if (!file) {
      throw new Error(
        "el campo 'layer' es requerido y tiene que ser un archivo .zip"
      );
    }
    const modules_available = ["coberturas", "habitat"];
    if (!modules_available.includes(body.module)) {
      throw new Error("Módulo no reconocido (parámetro module inválido)");
    }

    try {
      const shp_name = file.filename.substring(0, file.filename.length - 4);
      const shp_folder = await extract_file(shp_name);

      // Load to Geoserver
      const zip_path = await compress_file(body.module, shp_folder);
      await create_workspace(body.module);
      await create_datastore(body.module, shp_name, zip_path);

      // Load to PostGIS
      await upload_layer(shp_folder, body.module, body.srid);
      await drop_geom(body.module);
      res
        .status(200)
        .send({ message: `Capa ${shp_name} cargada exitosamente.` });
    } catch (error) {
      const err = new Error(error);
      if (!err.code) err.code = "INTERNAL_ERROR";
      throw err;
    }
  })
);

app.post(
  "/upload/parameters",
  upload_file.single("parameters"),
  wrapAsync(async ({ file }, res, next) => {
    logger.info(
      `archivo recibido para carga de parametros del modelo: ${JSON.stringify(
        file
      )}`
    );
    try {
      await upload_params(file.destination, file.filename);
      res.status(200).send({ message: "Parámetros cargados exitosamente." });
    } catch (error) {
      const err = new Error(error);
      if (!err.code) err.code = "INTERNAL_ERROR";
      throw err;
    }
  })
);

/**
 * @apiGroup Server
 * @api {get} /exec exec
 * @apiName ExecSimulator
 * @apiVersion 1.0.0
 * @apiDescription
 * Exec the simulator with the previously loaded layers and parameters.
 *
 * @apiQuery {String} result_name name for the simulator results file
 *
 * @apiSuccess {File} Result csv file to be downloaded
 *
 * @apiExample {curl} Example usage:
 * /exec?result_name=escenario1.csv
 */
app.get(
  "/exec",
  wrapAsync(async ({ query }, res, next) => {
    try {
      const result_file = await exec_model(
        query.result_name?.replace(/\s+/g, " ").trim()
      );
      res.download(result_file);
    } catch (error) {
      const err = new Error(error || "Ocurrió un error");
      if (!err.code) err.code = "INTERNAL_ERROR";
      throw err;
    }
  })
);

app.use(error_handler);

app.listen(port, () => {
  clear_folder("uploads");
  logger.info(`Example app listening at http://localhost:${port}`);
});
