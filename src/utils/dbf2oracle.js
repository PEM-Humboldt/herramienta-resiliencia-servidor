const { DBFFile } = require("dbffile");
const oracledb = require("oracledb");
const logger = require("./logger");

const dbf2oracle = async (file, module) => {
  try {
    let [fields, columns, rows] = await dbfRead(file);
    const connection = await dbConnect();
    await createTable(connection, module, fields);
    rows.map(async (record) => {
      await insertRecords(connection, module, columns, record);
    });
  } catch (err) {
    logger.info(err);
    const error = new Error("Error al cargar DBF a Oracle.");
    error.code = "INTERNAL_ERROR";
    throw error;
  }
};

const dbfRead = async (file) => {
  let dbf = {};
  let fields = [];
  let records = [];
  let array_fields = [];
  let columns = [];

  try {
    dbf = await DBFFile.open(file, { encoding: "UTF-8" });
    fields = dbf.fields;
    records = await dbf.readRecords();
    logger.info(`Lectura completa del archivo ${file}`);
  } catch (err) {
    logger.info(err);
    const error = new Error(`Error al leer el archivo ${file}.`);
    error.code = "INTERNAL_ERROR";
    throw error;
  }

  fields.map(function (f) {
    switch (f.type) {
      case "C":
        array_fields.push(f.name + " VARCHAR2(" + f.size + ")");
        break;
      case "N":
        array_fields.push(f.name + " NUMBER(" + f.size + ")");
        break;
      case "F":
        array_fields.push(f.name + " FLOAT");
        break;
      case "L":
        array_fields.push(f.name + " NUMBER(1) DEFAULT 0");
        break;
      case "D":
        array_fields.push(f.name + " DATE");
        break;
      case "I":
        array_fields.push(f.name + " INTEGER(0," + f.size + ")");
        break;
      default:
      case "M":
        array_fields.push(f.name + " VARCHAR2(" + f.size + ")");
        break;
      case "T":
        array_fields.push(f.name + " DATETIME");
        break;
      case "B":
        array_fields.push(f.name + " FLOAT(" + f.size + ")");
        break;
    }
    columns.push(":" + f.name);
  });

  let rows = [];
  records.map(function (record) {
    let values = [];
    for (const field of fields) {
      values.push(record[field.name]);
    }
    rows.push(values);
  });

  return [array_fields, columns, rows];
};

const dbConnect = async () => {
  let connection = {};
  const { ORACLE_HOST, ORACLE_PORT, DB_USER, DB_NAME, DB_PASSWORD } =
    process.env;
  const configConn = {
    user: DB_USER,
    password: DB_PASSWORD,
    connectString: `${ORACLE_HOST}:${ORACLE_PORT}/${DB_NAME}`,
  };

  try {
    connection = await oracledb.getConnection(configConn);
    logger.info(`Conexión establecida a la base de datos Oracle`);
  } catch (err) {
    logger.info(err);
    const error = new Error(
      `Error al establecer la conexión con la base de datos`
    );
    error.code = "INTERNAL_ERROR";
    throw error;
  }

  return connection;
};

const createTable = async (connection, table_name, array_fields) => {
  try {
    const queryDrop =
      "DECLARE cnt NUMBER; BEGIN SELECT COUNT(*) INTO cnt FROM user_tables WHERE table_name = '" +
      table_name.toUpperCase() +
      "'; IF cnt <> 0 THEN EXECUTE IMMEDIATE 'DROP TABLE " +
      table_name +
      "'; END IF; END; ";
    await connection.execute(queryDrop);
    const queryCreate =
      "CREATE TABLE " + table_name + " (" + array_fields.toString() + ")";
    await connection.execute(queryCreate);

    logger.info(`Tabla ${table_name} creada exitosamente`);
  } catch (err) {
    logger.info(err);
    const error = new Error(`Error al crear la tabla de en la base de datos`);
    error.code = "INTERNAL_ERROR";
    throw error;
  }
};

const insertRecords = async (connection, table_name, columns, values) => {
  try {
    const query =
      "INSERT INTO " +
      table_name.toUpperCase() +
      " VALUES(" +
      columns.toString() +
      ")";
    await connection.execute(query, values, { autoCommit: true });
    logger.info(`Registro cargado exitosamente`);
  } catch (err) {
    logger.info(err);
    const error = new Error(`Error al insertar el registro`);
    error.code = "INTERNAL_ERROR";
    throw error;
  }
};

module.exports = { dbf2oracle };
