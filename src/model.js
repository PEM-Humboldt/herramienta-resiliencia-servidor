const path = require("path");

const { NodeSSH } = require("node-ssh");

const { clear_output } = require("./utils/file_utils");
const logger = require("./utils/logger");

const OUTPUTS_DIR = `model_outputs`;

const exec_model = async (workspace, resultName = "model_time_series.csv", decimalSeparator = "coma") => {
  const filename = `${workspace}_${resultName}`;
  const {
    DB_SYSTEM,
    DB_PORT,
    DB_HOST,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
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
            `DB_SYSTEM=${DB_SYSTEM} DB_ADDRESS=${DB_HOST} DB_PORT=${DB_PORT} DB_USERNAME=${DB_USER} DB_PASSWORD=${DB_PASSWORD} DB_NAME=${DB_NAME} python3 run_principal.py -o ${resultName} -w ${workspace} -d ${decimalSeparator}`,
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

const upload_params = async (file, workspace) => {
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
            `${MODEL_PARAMS_PATH}/${workspace}_${file.filename}`
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
