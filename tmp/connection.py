from sqlalchemy.engine import create_engine

DIALECT = 'oracle'
SQL_DRIVER = 'cx_oracle'
USERNAME = 'test' #enter your username
PASSWORD = 'test123' #enter your password
HOST = 'localhost' #enter the oracle db host url
PORT = 1521 # enter the oracle port number
SERVICE = 'gis' # enter the oracle db service name
ENGINE_PATH_WIN_AUTH = DIALECT + '+' + SQL_DRIVER + '://' + USERNAME + ':' + PASSWORD +'@' + HOST + ':' + str(PORT) + '/?service_name=' + SERVICE

engine = create_engine(ENGINE_PATH_WIN_AUTH)

result = engine.execute('select * FROM TABLATEST')
for id in result:
    print("Values:", id)