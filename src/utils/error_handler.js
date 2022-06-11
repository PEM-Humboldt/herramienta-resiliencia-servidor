const logger = require("./logger");

module.exports = function (err, req, res, next) {
  switch (err.code) {
    case "LIMIT_UNEXPECTED_FILE":
      const path = req.url.substring(req.url.lastIndexOf("/") + 1);
      logger.error(`${err.message}: ${err.field}`);
      res.status(400).send({
        error: `El campo para el archivo es '${path}'. Usted envió: ${err.field}`,
      });
      break;
    case "MISSING_FORM_FIELDS":
      logger.error(`Los siguientes campos son obligatorios: ${err.fields}`);
      res.status(400).send({ error: `${err.message}: ${err.fields}` });
      break;
    case "INTERNAL_ERROR":
      logger.error(`${err.message}`);
      res
        .status(500)
        .send({ error: `Ocurrió un error, revisar logs. ${err.message}` });
      break;
    default:
      logger.error(`${err.message}. ${err.desc}`);
      res.status(400).send({ error: err.message });
      break;
  }
};
