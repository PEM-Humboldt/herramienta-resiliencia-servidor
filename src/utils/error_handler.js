const logger = require('./logger');

module.exports = function (err, req, res, next) {
  console.log('llegó acá?', err)
  switch (err.code) {
    case 'LIMIT_UNEXPECTED_FILE':
      logger.error(`${err.message}: ${err.field}`);
      res.status(400).send({ error: `El cmapo para el archivo es 'layer'. Usted envió: ${err.field}`});
      break;
    case 'MISSING_FORM_FIELDS':
      logger.error(`Los siguientes campos son obligatorios: ${err.fields}`);
      res.status(400).send({ error :`${err.message}: ${err.fields}` });
      break;
    case 'INTERNAL_ERROR':
      logger.error(`${err.message}`);
      res.status(500).send({ error :`Ocurrió un error: ${err.message}` });
      break;
    default:
      logger.error(`${err.message}. ${err.desc}`)
      res.status(400).send({ error: err.message });
      break;
  };
}
