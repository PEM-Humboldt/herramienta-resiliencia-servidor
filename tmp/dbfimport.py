from array import array
import os
from dbfread import DBF
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, exc


def oracleConnect():

    global engine
    global conn

    DIALECT = 'oracle'
    SQL_DRIVER = 'cx_oracle'
    USERNAME = os.getenv('DB_USER')
    PASSWORD = os.getenv('DB_PASSWORD')
    HOST = 'localhost'
    PORT = 1521
    SERVICE = os.getenv('DB_SERVICE')
    ENGINE_PATH_WIN_AUTH = DIALECT + '+' + SQL_DRIVER + '://' + USERNAME + ':' + PASSWORD +'@' + HOST + ':' + str(PORT) + '/?service_name=' + SERVICE

    engine = create_engine(ENGINE_PATH_WIN_AUTH)
    conn = engine.connect()

def openDBF():
    
    global fields
    global records

    fields = []
    records = []

    table = DBF('2018_cob_2.dbf', lowernames=True, encoding="utf-8")
    for field in table.fields:
        if(field.type=='N'):
            fields.append("{} INTEGER".format(field.name))
        if(field.type=='C'):
            fields.append("{} VARCHAR2({})".format(field.name,field.length))
        if(field.type=='I'):
            fields.append("{} INTEGER".format(field.name))
        if(field.type=='F'):
            fields.append("{} FLOAT({})".format(field.name,field.decimal_count))
    
    for record in table:
        records.append(record)

#for record in DBF('2018_cob_2.dbf', encoding="utf-8"):
#    print(record)

def createTable():
    global tableName
    tableName = 'students'
    tableFields = ','.join(fields)

    engine.execute("BEGIN EXECUTE IMMEDIATE 'DROP TABLE {}'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;".format(tableName))
    engine.execute("CREATE TABLE {} ({})".format(tableName, tableFields))

def insertRecords():

    try:
        for record in records:
            query = "INSERT INTO {} VALUES({})".format(tableName, record)
            print(query)
            id=conn.execute(query)
            
            print("Rows Added  = ",id.rowcount)
    
    except exc.SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        print(error)

if __name__ == '__main__':
    import sys
    oracleConnect()
    openDBF()
    createTable()
    insertRecords()
    #dbf2sa(sys.argv[1], 'sqlite:///converted.db')
