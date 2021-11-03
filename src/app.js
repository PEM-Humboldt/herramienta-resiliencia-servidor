const express = require('express')
const Koop = require('koop')
const provider = require('koop-provider-pg')

const error_handler = require('./utils/error_handler')
const extract_file = require('./extract_file');
const upload_file = require('./upload_file');
const upload_layer = require('./upload_layer');

const app = express()
const port = 3000

const koop = new Koop()
koop.register(provider)

app.use('/koop', koop.server)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/upload', upload_file.single('layer'), async function ({ file, body }, res, next) {
  console.log('archivo recibido: ', file.filename, file.originalname, file);
  const fields = ['srid'];
  missing = fields.filter(field => !(field in body));
  if (missing.length > 0) {
    const error = new Error('Hay campos faltantes');
    error.code = 'MISSING_FORM_FIELDS';
    error.fields = missing.join(', ');
    throw error;
  }
  if (!file) {
    throw new Error("el campo 'layer' es requerido y tiene que ser un archivo .zip");
  }

  try {
    const zip_name = file.filename.substring(0, file.filename.length - 4);
    const shp_folder = await extract_file(zip_name);
    await upload_layer(shp_folder, zip_name, body.srid)
    res.status(200).send({ message: `Capa ${zip_name} cargada exitosamente` });
  } catch (error) {
    const err = new Error(`Ocurrió un error: ${error}`);
    err.code = 'INTERNAL_ERROR';
    throw err;
  }
})

app.use(error_handler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
