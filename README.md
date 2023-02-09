# Servidor de la herramienta de resiliencia

Servicio para interactuar con el [simulador de la herramienta de resiliencia](https://github.com/PEM-Humboldt/herramienta-resiliencia-simulador) y cargar insumos de forma más sencilla.

# Tabla de contenido

1. [Instalación y uso de toda la herramienta](#instalación-y-uso)
   1. [Prerrequisitos](#prerrequisitos)
   1. [Preparación](#preparaci%C3%B3n)
      1. [Pasos previos](#pasos-previos)
      1. [Variables de ambiente](#variables-de-ambiente)
   1. [Ejecución con base de datos externa](#ejecución-con-una-base-de-datos-externa)
   1. [Ejecución creando una base de datos](#ejecución-incluyendo-la-creación-de-una-base-de-datos)
   1. [Ejecución habilitando GeoServer](#ejecución-habilitando-geoserver)
   1. [Ejecución sin docker-compose](#ejecución-sin-docker-compose)
   1. [Actualización](#actualización-de-imágenes)
1. [Instalación en modo desarrollo](#modo-desarrollo)
1. Endpoints
   1. [Pruebas](#probar-endpoints)
   1. [Documentación](#generar-documentación-de-los-endpoints)

# Instalación y uso

A continuación encuentra los pasos a seguir para poner a andar todos los componentes de la herramienta.

## Prerrequisitos

Debe tener instalado Docker (v20.10.8) y docker-compose(v1.25.0).

Si usa una versión mayor de Docker, la cual viene con el plugin `compose` debe cambiar los comandos `docker-compose` por `docker compose` en las instrucciones.

## Preparación

### Pasos previos

**Antes de ejecutar** este servidor, tenga en cuenta:

1. Debe crear una carpeta vacía en el servidor para ser asociada a la variable de ambiente MODEL_OUPUTS_DIR.
2. Si va a habilitar GeoServer, debe crear una carpeta vacía en el servidor para ser asociada a la variable GS_DATA_DIR.

Puede producirse un error si el servidor no tiene acceso a las carpetas porque no existian antes de ejecutar el servidor. Evite este incoveniente al crear las carpetas vacías.

### Variables de ambiente

En el archivo [.env](.env) de este repositorio se encuentran unos valores de ejemplo para las variables requeridas, puede usar este archivo para configurar las variables, pero recuerde **NO** versionar esos cambios.

A continuación la descripción de las variables:

- DB_NAME: nombre de la base de datos con la que se va a trabajar
- DB_USER: usuario para acceder a la base de datos
- DB_PASSWORD: contraseña del usuario indicado
- MODEL_OUPUTS_DIR: ruta a la carpeta en el host (creada en la sección [Pasos previos](#pasos-previos)) donde se almacenarán los resultados de la ejecución del simulador (preferiblemente ruta absoluta).
- MODEL_PASSWORD: contraseña para el usuario que ejecuta el simulador

Las siguientes variables son necesarias si va a usar una base de datos externa, es decir, no va a crear una con los demás componentes de la herramienta:

- DB_ADDRESS: url o ip del host de la base de datos
- DB_PORT: puerto de la base de datos
- DB_SYSTEM: motor de la base de datos a usar, los posibles valores son 'postgres' u 'oracle'

Las siguientes variables sólo son necesarias si se va a usar GeoServer

- GS_USER: nombre del usuario administrador de geoserver
- GS_PASS: contraseña del administrador de geoserver
- GS_DATA_DIR: ruta a la carpeta en el host (creada en la sección [Pasos previos](#pasos-previos)) donde se almacenarán los datos de GeoServer (preferiblemente ruta absoluta).

## Ejecución con una base de datos externa

El siguiente comando crea un contenedor para el servidor y uno para el simulador que se conectan a una base de datos externa:

```
docker-compose -f docker-compose.yml up -d
```

## Ejecución incluyendo la creación de una base de datos

Para crear una base de datos **PostGIS** junto con la creación del servidor y el simulador, ejecute:

```
docker-compose -f docker-compose.yml -f docker-compose.override.postgis.yml up -d
```

Para crear una base de datos **Oracle** junto con la creación del servidor y el simulador, ejecute:

```
docker-compose -f docker-compose.yml -f docker-compose.override.oracle.yml up -d
```

Tenga en cuenta que la base de datos de Oracle se demora en estar lista para ser usada, puede ver los logs del contenedor con `docker logs tool_db` (Espere hasta que vea el mensaje `DATABASE IS READY TO USE!`).

## Ejecución habilitando GeoServer

Para usar GeoServer, ejecute cualquiera de los comandos de las secciones [con base de datos externa](#ejecución-con-una-base-de-datos-externa) o [creando una base de datos](#ejecución-incluyendo-la-creación-de-una-base-de-datos) con la opción `-f docker-compose.override.geoserver.yml`

Por ejemplo, para usar el GeoServer y crear una base de datos PostGIS:

```
docker-compose -f docker-compose.yml -f docker-compose.override.postgis.yml -f docker-compose.override.geoserver.yml up -d
```

## Ejecución sin docker-compose

Si no desea usar docker-compose puede levantar los contenedores con docker como se explica en los siguientes pasos. Estos pasos no incluyen la creación de una base de datos ni el uso de GeoServer y requieren los mismos pasos previos y configuraciones.

**Es importante que las rutas a las carpetas creadas sean rutas absolutas**. Todos los comandos se ejecutan desde la carpeta de este repositorio.

1. Si las variables de ambiente sólo fueron definidas en el archivo `.env`, debe cargarlas antes de ejecutar los demás comandos: `source .env`
1. Debe crear una red, por ejemplo llamada fibras: `docker network create fibras`
1. Construya la imagen del simulador: `docker build -t simulator --build-arg userpassword=$MODEL_PASSWORD 'https://github.com/PEM-Humboldt/herramienta-resiliencia-simulador.git#main'`
1. Construya la imagen del servidor: `docker build -t server .`
1. Cree el contenedor para el simulador: `docker run --name simulator -v $MODEL_OUPUTS_DIR:/home/model/app/outputs --net fibras --restart always -d simulator`
1. Cree el contenedor para el servidor: `docker run --name server -p 3000:3000 -v $MODEL_OUPUTS_DIR:/home/node/app/model_outputs --net fibras --restart always -e DB_HOST=$DB_ADDRESS -e DB_PORT=$DB_PORT -e DB_SYSTEM=$DB_SYSTEM -e DB_NAME=$DB_NAME -e DB_USER=$DB_USER -e DB_PASSWORD=$DB_PASSWORD -e MODEL_HOST=simulator -e MODEL_PASSWORD=$MODEL_PASSWORD -e MODEL_PARAMS_PATH=/home/model/app/condiciones_iniciales/ -e GS_ENABLE=false -d server`

## Actualización de imágenes

La primera vez que se levantan los contenedores, las imágenes de los componentes del servidor y el simulador son creadas. Para actualizar estas imágenes (por ejemplo después de cambios en el código) debe ejecutar:

```
docker-compose -f docker-compose.yml build
```

y después volver a ejecutar el comando con el que haya levantado el sistema, por ejemplo, usando una base de datos externa:

```
docker-compose -f docker-compose.yml up -d
```

# Modo desarrollo

El modo desarrollo está pensado para facilitar las pruebas de cambios realizados al servidor, o para probar estados del simulador que no corresponden a la rama main del [repositorio](https://github.com/PEM-Humboldt/herramienta-resiliencia-simulador). Si desea realizar cambios al simulador se recomienda trabajar directamente sobre el repositorio del mismo.

Para tener el ambiente de desarrollo listo siga los siguientes pasos:

1. Clone el [simulador](https://github.com/PEM-Humboldt/herramienta-resiliencia-simulador) en la misma carpeta donde clonó este repositorio (Servidor).

1. Cree las carpetas y configure las variables de ambiente descritas en la sección [Preparación](#preparación).

1. Ejecute cualquiera de los comandos de las secciones [con base de datos externa](#ejecución-con-una-base-de-datos-externa) o [creando una base de datos](#ejecución-incluyendo-la-creación-de-una-base-de-datos) o [habilitando GeoServer](#ejecución-habilitando-geoserver) con la opción `-f docker-compose.override.dev.yml`

Por ejemplo, para levantar los contenedores en modo desarrollo, y también crear una base de datos postGIS:

```
docker-compose -f docker-compose.yml -f docker-compose.override.postgis.yml -f docker-compose.override.dev.yml up -d
```

# Probar endpoints

En la raíz de este repositorio se encuentra el archivo [test_endpoints.json](test_endpoints.json) el cual puede importar en [Insomnia](https://insomnia.rest/download) para probar los endpoints.

# Generar documentación de los endpoints

Ejecute `npm run docs` en la raíz del proyecto para generar la documentación de los endpoints, esta es almacenada en la carpeta `docs`. Para visualizarla abra en un navegador el archivo `docs/index.html`.

# Autores

- **Erika Suárez Valencia** - [erikasv](https://github.com/erikasv)
- **Manuel Galvez** - [ManuelStardust](https://github.com/ManuelStardust)

# Licencia

Este proyecto está licenciado bajo la licencia [MIT](LICENSE)

# Reconocimientos

Esta aplicación hace parte de los resultados del componente 2 del acuerdo No. 19-155 firmado entre el Instituto Humboldt y Ecopetrol [FIBRAS](http://humboldt.org.co/fibras/componente2.html)
