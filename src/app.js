const express = require('express')
const Koop = require('koop')
const provider = require('koop-provider-pg')

const app = express()
const port = 3000

const koop = new Koop()
koop.register(provider)

app.use('/koop', koop.server)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
