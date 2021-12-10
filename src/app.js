const express = require("express");
const helmet = require("helmet");

const {
  upload: upload_file,
  extract: extract_file,
  compress: compress_file,
} = require("./file_utils");
const { create_workspace, create_datastore } = require("./geoserver");
const upload_layer = require("./upload_layer");
const error_handler = require("./utils/error_handler");

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
  wrapAsync(async function ({ file, body }, res, next) {
    console.log("archivo recibido: ", file.filename, file.originalname, file);
    const fields = ["srid"];
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

    try {
      const shp_name = file.filename.substring(0, file.filename.length - 4);
      const shp_folder = await extract_file(shp_name);

      // Load to Geoserver
      const zip_path = await compress_file(shp_name, shp_folder);
      await create_workspace(shp_name);
      await create_datastore(shp_name, zip_path);

      // Load to PostGIS
      await upload_layer(shp_folder, shp_name, body.srid);
      res
        .status(200)
        .send({ message: `Capa ${shp_name} cargada exitosamente` });
    } catch (error) {
      const err = new Error(error);
      if (!err.code) err.code = "INTERNAL_ERROR";
      throw err;
    }
  })
);

app.use(error_handler);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
