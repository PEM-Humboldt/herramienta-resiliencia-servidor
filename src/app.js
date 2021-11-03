const express = require('express')
const Koop = require('koop')
const provider = require('koop-provider-pg')

const error_handler = require('./utils/error_handler')
const file_extract = require('./file_extract');
const upload = require('./file_upload');

const app = express()
const port = 3000

const koop = new Koop()
koop.register(provider)

app.use('/koop', koop.server)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/upload', upload.single('layer'), async function ({ file, body }, res, next) {
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
    await file_extract(zip_name);
    console.log(process.env)
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send(`Ocurrió un error: ${error}`)
  }
})

app.use(error_handler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
