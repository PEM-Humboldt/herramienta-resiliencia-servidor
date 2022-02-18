const fs = require("fs/promises");

const axios = require("axios");

const logger = require("./logger");

const { GS_USER, GS_PASS } = process.env;
const GS_URL = `http://${GS_USER}:${GS_PASS}@geoserver:8080/geoserver/rest`;

const create_workspace = async (name) => {
  let exists = false;
  try {
    await get_workspace(name);
    exists = true;
    logger.info("geoserver: workspace ya existe");
  } catch (error) {
    if (!error.response || error.response.status !== 404) {
      logger.error(`geoserver: error consultando workspace ${error}`);
      const err = new Error("Verificar estado del servicio de GeoServer");
      err.code = "INTERNAL_ERROR";
      throw err;
    }
  }

  if (!exists) {
    try {
      await axios.post(`${GS_URL}/workspaces`, {
        workspace: {
          name,
        },
      });
      logger.info("geoserver: workspace creado correctamente");
    } catch (error) {
      logger.error(`geoserver: error creando workspace ${error}`);
      const err = new Error("Verificar estado del servicio de GeoServer");
      err.code = "INTERNAL_ERROR";
      throw err;
    }
  }
};

const get_workspace = (name) => axios.get(`${GS_URL}/workspaces/${name}`);

const create_datastore = async (shp, shp_name, zip) => {
  try {
    const data = await fs.readFile(zip);
    await axios.request({
      url: `${GS_URL}/workspaces/${shp}/datastores/${shp}/file.shp`,
      method: "put",
      params: { filename: `${shp_name}_gs.zip` },
      data,
      maxBodyLength: Infinity,
      headers: { "Content-Type": "application/zip" },
    });
  } catch (error) {
    console.log(error);
    logger.error(`geoserver: error cargando capa ${error}`);
    const err = new Error("Verificar estado del servicio de GeoServer");
    err.code = "INTERNAL_ERROR";
    throw err;
  }
};

module.exports = { create_workspace, create_datastore };
