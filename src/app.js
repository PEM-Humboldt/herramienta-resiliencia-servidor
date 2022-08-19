const express = require("express");
const helmet = require("helmet");
const { DBFFile } = require("dbffile");
const oracledb = require('oracledb')

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

/**
 * @apiGroup Server
 * @api {post} /upload/layer uploadLayer
 * @apiName UploadLayer
 * @apiVersion 1.0.0
 * @apiDescription
 * Upload layers for different modules of the simulator (once at a time).
 *
 * @apiBody {File} layer zip file with the shape layer to load
 * @apiBody {Number} srid layer's spatial reference
 * @apiBody {String} module module associated with the layer, possible values are: 'coberturas', 'habitat'
 * @apiBody {String} workspace workspace name
 *
 * @apiSuccess {String} message success or error message
 *
 * @apiExample {curl} Example usage:
 * curl --request POST \
 *   --url http://localhost:3000/upload/layer \
 *   --header 'Content-Type: multipart/form-data; boundary=---011000010111000001101001' \
 *   --form layer=@/capas/nucleo_1_coberturas.zip \
 *   --form srid=4686 \
 *   --form module=coberturas \
 *   --form workspace=nucleo1
 */
app.post(
  "/upload/layer",
  upload_file.single("layer"),
  wrapAsync(async ({ file, body }, res, next) => {
    logger.info(`archivo recibido para carga de capa: ${JSON.stringify(file)}`);
    const fields = ["srid", "module", "workspace"];
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
      const workspace = body.workspace?.replace(/\s+/g, " ").trim();
      const workspaceName = `${workspace}_${body.module}`;

      // Load to Geoserver
      const zip_path = await compress_file(workspaceName, shp_folder);
      await create_workspace(workspaceName);
      await create_datastore(workspaceName, shp_name, zip_path);

      // Load to PostGIS
      await upload_layer(shp_folder, workspaceName, body.srid);
      await drop_geom(workspaceName);
      res.status(200).send({
        message: `Capa ${shp_name} cargada exitosamente para el workspace ${body.workspace}.`,
      });
    } catch (error) {
      const err = new Error(error);
      if (!err.code) err.code = "INTERNAL_ERROR";
      throw err;
    }
  })
);

/**
 * @apiGroup Server
 * @api {post} /upload/parameters uploadParameters
 * @apiName UploadParameters
 * @apiVersion 1.0.0
 * @apiDescription
 * Upload the parameters file for the simulation
 *
 * @apiBody {File} parameters xlsx file with the parameters for the simulation
 * @apiBody {String} workspace workspace name
 *
 * @apiSuccess {String} message success or error message
 *
 * @apiExample {curl} Example usage:
 * curl --request POST \
 *  --url http://localhost:3000/upload/parameters \
 *  --header 'Content-Type: multipart/form-data; boundary=---011000010111000001101001' \
 *  --form parameters=@/parametros/parameters.xlsx \
 *  --form workspace=nucleo1
 */
app.post(
  "/upload/parameters",
  upload_file.single("parameters"),
  wrapAsync(async ({ file, body }, res, next) => {
    logger.info(
      `archivo recibido para carga de parametros del modelo: ${JSON.stringify(
        file
      )}`
    );
    const fields = ["workspace"];
    missing = fields.filter((field) => !(field in body));
    if (missing.length > 0) {
      const error = new Error("Hay campos faltantes");
      error.code = "MISSING_FORM_FIELDS";
      error.fields = missing.join(", ");
      throw error;
    }
    try {
      await upload_params(file, body.workspace);
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
 * @apiQuery {String} workspace workspace name
 *
 * @apiSuccess {File} Result csv file to be downloaded
 *
 * @apiExample {curl} Example usage:
 * curl --request GET \
 *  --url 'http://localhost:3000/exec?result_name=escenario1.csv&workspace=nucleo1'
 */
app.get(
  "/exec",
  wrapAsync(async ({ query }, res, next) => {
    let outputName = query.result_name?.replace(/\s+/g, " ").trim();
    const fields = ["workspace"];

    missing = fields.filter((field) => !(field in query));
    if (missing.length > 0) {
      const error = new Error("Hay campos faltantes");
      error.code = "MISSING_FORM_FIELDS";
      error.fields = missing.join(", ");
      throw error;
    }
    try {
      const result_file = await exec_model(query.workspace, outputName);
      res.download(result_file);
    } catch (error) {
      const err = new Error(error || "Ocurrió un error");
      if (!err.code) err.code = "INTERNAL_ERROR";
      throw err;
    }
  })
);

app.get("/dbf", (req, res) => {
  dbfRead();
  res.send("DBF TEST");
});

async function dbfRead() {
  let dbf = await DBFFile.open('../tmp/2018_cob_2.dbf', { encoding: 'UTF-8'}); //Ruta al archivo dbf
  let fields = dbf.fields;
  let records = await dbf.readRecords();
  
  const configConn = {
    user: 'docker',
    password: 'docker',
    connectString: 'localhost:1522/gis'
  }

  let conn = await oracledb.getConnection(configConn)
  
  let stringFields = [];
  let columns = [];
  const tableName = 'tablatest';
  
  fields.map(function(f){
    switch (f.type) {
      case 'C':
        stringFields.push(f.name + ' VARCHAR2(' + f.size +')');
        break;
      case 'N':
        stringFields.push(f.name + ' NUMBER(' + f.size +')');
        break;
      case 'F':
        stringFields.push(f.name + ' FLOAT');
        break;
      case 'L':
        stringFields.push(f.name + ' NUMBER(1) DEFAULT 0');
        break;
      case 'D':
        stringFields.push(f.name + ' DATE');
        break;
      case 'I':
        stringFields.push(f.name + ' INTEGER(0,' + f.size +')');
        break;
        default:
      case 'M':
        stringFields.push(f.name + ' VARCHAR2(' + f.size +')');
        break;
      case 'T':
        stringFields.push(f.name + ' DATETIME');
        break;
      case 'B':
        stringFields.push(f.name + ' FLOAT(' + f.size +')');
        break;
    }
    columns.push(":"+f.name);
  });

  const queryDrop = "DECLARE cnt NUMBER; BEGIN SELECT COUNT(*) INTO cnt FROM user_tables WHERE table_name = '" + tableName.toUpperCase() + "'; IF cnt <> 0 THEN EXECUTE IMMEDIATE 'DROP TABLE " + tableName + "'; END IF; END; "
  
  let resultDrop = await conn.execute(queryDrop)

  const queryCreate = 'CREATE TABLE ' + tableName + ' (' + stringFields.toString() + ')'
  
  let resultCreate = await conn.execute(queryCreate)

  let stringInsert = [];
  records.map(function(record) {
    let values = [];
    let value;
    for (let field of fields) {
      values.push(record[field.name]);
    }
    oracleInsert(conn, tableName, columns, values)
  });
}

async function oracleInsert(conn, tableName, columns, values) {

  try {
    const query = "INSERT INTO " + tableName + " VALUES(" + columns.toString() +")";

    const result = await conn.execute(query, values,{ autoCommit: true});

    console.log(result);

  } catch (err) {
    console.error(err);
  }
}

app.use(error_handler);

app.listen(port, () => {
  clear_folder("uploads");
  logger.info(`Example app listening at http://localhost:${port}`);
});
