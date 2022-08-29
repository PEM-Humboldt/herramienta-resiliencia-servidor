const { DBFFile } = require("dbffile");
const oracledb = require('oracledb')
const logger = require("./logger");

const dbf2oracle = async (file, module) => {
  let connection
  let [ fields, columns, rows ] = await dbfRead(file);
  connection = await dbConnect();
  await createTable(connection, module, fields);
  rows.map(function(record){
    insertRecords(connection, module, columns, record);
  });
}

const dbfRead = async (file) => {
  let dbf
  let fields
  let records 
  let arrayFields = [];
  let columns = [];

  try {
    dbf = await DBFFile.open(file, { encoding: 'UTF-8'}); //Ruta al archivo dbf
    fields = dbf.fields;
    records = await dbf.readRecords();
    logger.info(`Lectura completa del archivo ${file}`);
  } catch (err) {
    logger.info(err);
  }
    
    fields.map(function(f){
      switch (f.type) {
        case 'C':
          arrayFields.push(f.name + ' VARCHAR2(' + f.size +')');
          break;
        case 'N':
          arrayFields.push(f.name + ' NUMBER(' + f.size +')');
          break;
        case 'F':
          arrayFields.push(f.name + ' FLOAT');
          break;
        case 'L':
          arrayFields.push(f.name + ' NUMBER(1) DEFAULT 0');
          break;
        case 'D':
          arrayFields.push(f.name + ' DATE');
          break;
        case 'I':
          arrayFields.push(f.name + ' INTEGER(0,' + f.size +')');
          break;
          default:
        case 'M':
          arrayFields.push(f.name + ' VARCHAR2(' + f.size +')');
          break;
        case 'T':
          arrayFields.push(f.name + ' DATETIME');
          break;
        case 'B':
          arrayFields.push(f.name + ' FLOAT(' + f.size +')');
          break;
      }
      columns.push(":"+f.name);
    });
  
    let rows = [];
    records.map(function(record) {
      let values = [];
      let value;
      for (let field of fields) {
        values.push(record[field.name]);
      }
      rows.push(values);
    });

    return [ arrayFields, columns, rows ];
}
  
const dbConnect = async () => {
  let connection
  const { DB_SYSTEM, ORACLE_HOST, ORACLE_PORT, DB_USER, DB_DATABASE, DB_PASSWORD } = process.env;
  const configConn = {
    user: DB_USER,
    password: DB_PASSWORD,
    connectString: `${ORACLE_HOST}:${ORACLE_PORT}/${DB_DATABASE}`
  }

  try {
    connection = await oracledb.getConnection(configConn);
    logger.info(`Conexión establecida a la base de datos Oracle`);
  } catch (err) {
    logger.info(err);
  }

  return connection;

}
  
const createTable =  async (connection, tableName, arrayFields) => {
  try {
    const queryDrop = "DECLARE cnt NUMBER; BEGIN SELECT COUNT(*) INTO cnt FROM user_tables WHERE table_name = '" + tableName.toUpperCase() + "'; IF cnt <> 0 THEN EXECUTE IMMEDIATE 'DROP TABLE " + tableName + "'; END IF; END; "
    let resultDrop = await connection.execute(queryDrop)
    const queryCreate = 'CREATE TABLE ' + tableName + ' (' + arrayFields.toString() + ')'
    let resultCreate = await connection.execute(queryCreate)

    logger.info(`Tabla ${tableName} creada exitosamente`);
  } catch (err) {
    logger.info(err);
  }
}

const insertRecords = async (connection, tableName, columns, values) => {
    try {
      const query = "INSERT INTO " + tableName.toUpperCase() + " VALUES(" + columns.toString() +")";
      const result = await connection.execute(query, values,{ autoCommit: true});
      logger.info(`Registro cargado exitosamente`);
    } catch (err) {
      logger.info(err);
    }
}

module.exports = { dbf2oracle };