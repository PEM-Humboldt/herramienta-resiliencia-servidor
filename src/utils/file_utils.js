const { spawn } = require("child_process");
const { readdir, rm, unlink, open } = require("fs/promises");
const path = require("path");

const multer = require("multer");

const logger = require("./logger");

const extract = (filename) => {
  return new Promise((res, rej) => {
    const unzip = spawn("unzip", [
      "-j",
      "-u",
      `${process.cwd()}/uploads/${filename}.zip`,
      "-d",
      `${process.cwd()}/uploads/${filename}`,
    ]);

    unzip.stdout.on("data", (data) => {
      logger.info(`stdout: ${data}`);
    });

    unzip.stderr.on("data", (data) => {
      logger.error(`stderr: ${data}`);
    });

    unzip.on("close", (code) => {
      logger.info(`Extracción finalizada. Código ${code}`);
      if (code === 0) {
        res(`${process.cwd()}/uploads/${filename}`);
      } else {
        rej("Extracción fallida, ver logs para más información");
      }
    });
  });
};

const compress = (filename, folder_path) => {
  return new Promise((res, rej) => {
    const zip = spawn("zip", [
      "-j",
      "-r",
      `${process.cwd()}/uploads/${filename}_gs.zip`,
      `${folder_path}`,
    ]);

    zip.stdout.on("data", (data) => {
      logger.info(`stdout: ${data}`);
    });

    zip.stderr.on("data", (data) => {
      logger.error(`stderr: ${data}`);
    });

    zip.on("close", (code) => {
      logger.info(`Archivo para el geoserver preparado. Código ${code}`);
      if (code === 0) {
        res(`${process.cwd()}/uploads/${filename}_gs.zip`);
      } else {
        rej(
          "Creación de archivo para GeoServer fallida, ver logs para más información"
        );
      }
    });
  });
};

const storage = multer.diskStorage({
  destination: `${process.cwd()}/uploads/`,
  filename: function (req, file, cb) {
    if (file.fieldname === "layer") {
      const name = file.originalname.substring(0, file.originalname.length - 4);
      cb(null, `${name.replace(/[^\w-]/gi, "")}.zip`);
    } else if (file.fieldname === "parameters") {
      cb(null, "parameters.xlsx");
    }
  },
});

const filter = (req, file, cb) => {
  const conds = [
    file.fieldname === "layer" && file.mimetype !== "application/zip",
    file.fieldname === "parameters" &&
      file.mimetype !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const errors = [
    new Error("Sólo se aceptan archivos .zip"),
    new Error("Sólo se aceptan archivos .xlsx"),
  ];
  for (const idx in conds) {
    if (conds.hasOwnProperty(idx)) {
      if (conds[idx] === true) {
        const err = errors[idx];
        err.desc = `Archivo recibido: ${file.originalname}`;
        cb(err);
        return;
      }
    }
  }
  cb(null, true);
};

const clear_folder = async (folder_name) => {
  const folder_path = path.join(process.cwd(), folder_name);
  try {
    const files = await readdir(folder_path);
    files.forEach((file) => {
      rm(path.join(folder_path, file), { recursive: true });
    });
  } catch (error) {
    const err = new Error(`Ocurrió un error: ${error}`);
    err.code = "INTERNAL_ERROR";
    throw err;
  }
};

const clear_output = async (folder_name, file_name) => {
  const folder_path = path.join(process.cwd(), folder_name);
  try {
    const files = await readdir(folder_path);
    files.forEach((file) => {
      if(file==file_name) rm(path.join(folder_path, file), { recursive: true });
    });
  } catch (error) {
    const err = new Error(`Ocurrió un error: ${error}`);
    err.code = "INTERNAL_ERROR";
    throw err;
  }
};

module.exports = {
  upload: multer({ storage, fileFilter: filter }),
  extract,
  compress,
  clear_folder,
  clear_output
};
