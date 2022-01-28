const { readdir } = require("fs/promises");
const { NodeSSH } = require("node-ssh");

const logger = require("./utils/logger");

module.exports = () => {
  const {
    PG_HOST,
    PG_PORT,
    PG_DATABASE,
    PG_USER,
    PG_PASSWORD,
    MODEL_PASSWORD,
  } = process.env;

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
            `POSTGRES_ADDRESS=${PG_HOST} POSTGRES_PORT=${PG_PORT} POSTGRES_USERNAME=${PG_USER} POSTGRES_PASSWORD=${PG_PASSWORD} POSTGRES_DBNAME=${PG_DATABASE} python3 run_principal.py`,
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
            res();
          })
          .catch((err) => {
            logger.error(`Simulación - error: ${err}`);
            throw Error("No se pudo ejecutar el simulador.");
          });
      });
  });
};
