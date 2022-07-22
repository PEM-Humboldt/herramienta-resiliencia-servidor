const path = require("path");

const { NodeSSH } = require("node-ssh");

const { clear_output } = require("./utils/file_utils");
const logger = require("./utils/logger");

const OUTPUTS_DIR = `model_outputs`;

const exec_model = async (workspace, resultName = "model_time_series.csv") => {
  let filename = `${workspace}_${resultName}`;
  const {
    PG_HOST,
    PG_PORT,
    PG_DATABASE,
    PG_USER,
    PG_PASSWORD,
    MODEL_PASSWORD,
  } = process.env;

  await clear_output(OUTPUTS_DIR, filename);
  return new Promise((res, rej) => {
    const ssh = new NodeSSH();
    ssh
      .connect({
        host: "tool_simulator",
        username: "model",
        password: MODEL_PASSWORD,
      })
      .then(() => {
        ssh
          .execCommand(
            `POSTGRES_ADDRESS=${PG_HOST} POSTGRES_PORT=${PG_PORT} POSTGRES_USERNAME=${PG_USER} POSTGRES_PASSWORD=${PG_PASSWORD} POSTGRES_DBNAME=${PG_DATABASE} python3 run_principal.py -o ${resultName} -w ${workspace}`,
            { cwd: "/home/model/app" }
          )
          .then((result) => {
            if (result.code !== 0) {
              logger.error(`Simulación - stderr: ${result.stderr}`);
              rej(
                "El simulador falló. Revisar logs con 'Simulación - stderr:'"
              );
            }
            logger.info(
              `Simulación finalizada. Código: ${result.code} - stdout: ${result.stdout}`
            );
            res(path.join(process.cwd(), OUTPUTS_DIR, filename));
          })
          .catch((err) => {
            logger.error(`Simulación - error: ${err}`);
            throw Error("No se pudo ejecutar el simulador.");
          });
      });
  });
};

const upload_params = async (file, body) => {
  const { MODEL_PASSWORD, MODEL_PARAMS_PATH } = process.env;

  return new Promise((res, rej) => {
    const ssh = new NodeSSH();
    ssh
      .connect({
        host: "tool_simulator",
        username: "model",
        password: MODEL_PASSWORD,
      })
      .then(() => {
        ssh
          .putFile(
            `${file.destination}/${file.filename}`,
            `${MODEL_PARAMS_PATH}/${body.workspace}_${file.filename}`
          )
          .then((result) => {
            logger.info("Archivo copiado exitosamente");
            res("ok");
          })
          .catch((err) => {
            logger.error(`Error copiando archivo de parámetros: ${err}`);
            throw Error("Error copiando archivo de parámetros.");
          });
      });
  });
};

module.exports = { exec_model, upload_params };
