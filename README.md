# Servidor de la Herramienta de Resiliencia

Servicio para cargar capas geográficas en formato shp y disponerlas en formato FeatureServer o MapServer

## Prerrequisitos

El modo de uso recomendado es por medio de contenedores Docker (v20.10.8) usando docker-compose(v1.25.0).

En el repositorio se encuentran los archivos `docker-compose.yml` y `docker-compose.dev.yml` que facilitan es despliegue de dichos contenedores tanto para producción como para desarrollo.

## Configuración previa

_Antes de ejecutar_ este servidor, se deben crear dos carpetas vacías en el servidor para asociarlas como rutas de las variables GS_DATA_DIR y MODEL_OUPUTS_DIR.

Puede producirse un error si el servidor no tiene acceso a las carpetas porque no existan antes de ejecutar el servidor. Evite este incoveniente al crear las dos carpetas vacías.

El nombre sugerido para la carpeta a asociar a la variable GS_DATA_DIR es 'geoserver_data', y el nombre sugerido para la carpeta de la variable MODEL_OUPUTS_DIR es 'model_outputs'.

## Cómo ejecutar

1. Configure las variables de ambiente necesarias para el funcionamiento de la herramienta. En el archivo .env de este repositorio se encuetnran unos valores de ejemplo de dichas variables, si lo desea, puede cambiar esos valores y guardarlos en el archivo, pero recuerde no versionar esos cambios. A continuación se presetan las variables necesarias:

   - DB_NAME: nombre de la base de datos con la que se va a trabajar
   - DB_USER: usuario para acceder a la base de datos
   - DB_PASSWORD: contraseña del usuario indicado
   - GS_USER: nombre del usuario administrador de geoserver
   - GS_PASS: contraseña del administrador de geoserver
   - GS_DATA_DIR: ruta a la carpeta en el host donde se almacenaran los datos de geoserver (puede ser relativa a la ubicación del archivo docker-compose.yml de este repositorio)
   - MODEL_OUPUTS_DIR: ruta a la carpeta en el host donde se almacenaran los resultados de la ejecución del simulador (puede ser relativa a la ubicación del archivo docker-compose.yml de este repositorio)
   - MODEL_PASSWORD: contraseña para el usuario que ejecuta el simulador

2. Puede correr el sistema de 2 formas: con postgres o con oracle.

   - Para correr el sistema con postgres, ejecute:
     ```
     docker-compose up -d
     ```
   - Para correr el sistema con oracle, ejecute:
     ```
     docker-compose -f docker-compose.yml -f docker-compose.override.oracle.yml up -d
     ```
3. El sistema tiene la opción de usar geoserver, sin embargo por defecto no esta activado. Para usar el sistema con geoserver, ejecute:

     ```
     docker-compose -f docker-compose.yml -f docker-compose.override.geoserver.yml up -d
     ```

## Modo desarrollo

Para el modo desarrollo, siga los siguientes pasos:

1. Descargue el [código del simulador](https://github.com/PEM-Humboldt/herramienta-resiliencia-simulador) en la misma ruta donde almacenó el [código del servidor](https://github.com/PEM-Humboldt/herramienta-resiliencia-servidor)
1. Configure las mismas variables de ambiente explicadas en la sección anterior.

1. Para correr el sistema con postgres:
   ```
   docker-compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.dev.yml up -d
   ```
   O con oracle:
   ```
   docker-compose -f docker-compose.yml -f docker-compose.override.oracle.yml -f docker-compose.dev.yml up -d
   ```

## Probar endpoints

En la raíz de este repositorio se encuentra el archivo [test_endpoints.json](test_endpoints.json) el cual puede importar en [Insomnia](https://insomnia.rest/download) para probar los endpoints.

## Generar documentación de los endpoints

Ejecute `npm run docs` en la raíz del proyecto para generar la documentación de los endpoints, esta es almacenada en la carpeta `docs`. Para visualizarla abra en un navegador el archivo `docs/index.html`.

## Autores

- **Erika Suárez Valencia** - [erikasv](https://github.com/erikasv)
- **Manuel Galvez** - [ManuelStardust](https://github.com/ManuelStardust)

## Licencia

Este proyecto está licenciado bajo la licencia [MIT](LICENSE)

## Reconocimientos

Esta aplicación hace parte de los resultados del componente 2 del acuerdo No. 19-155 firmado entre el Instituto Humboldt y Ecopetrol [FIBRAS](http://humboldt.org.co/fibras/componente2.html)
