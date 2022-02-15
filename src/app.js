const express = require("express");
const helmet = require("helmet");

const {
  upload: upload_file,
  extract: extract_file,
  compress: compress_file,
  clear_folder,
} = require("./utils/file_utils");
const { create_workspace, create_datastore } = require("./utils/geoserver");
const { exec: exec_model } = require("./model");
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

app.post(
  "/upload",
  upload_file.single("layer"),
  wrapAsync(async ({ file, body }, res, next) => {
    logger.info("archivo recibido: ", file.filename, file.originalname, file);
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
    const modules_available = ["coberturas"];
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

app.get(
  "/exec",
  wrapAsync(async (req, res, next) => {
    try {
      const result_file = await exec_model();
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
