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

1. Configure las variables de ambiente necesarias para el funcionamiento de la herramienta (los valores aquí puestos son ejemplos y deben ser cambiados):
   ```sh
   export PG_DATABASE=gis PG_USER=docker PG_PASSWORD=docker GS_USER=admin GS_PASS=geoserver GS_DATA_DIR='../geoserver_data' MODEL_OUPUTS_DIR='../model_outputs' MODEL_PASSWORD='model_password'
   ```
1. Ejecute docker-compose con el archivo principal:
   ```
   docker-compose up -d
   ```

## Modo desarrollo

Para el modo desarrollo, siga los siguientes pasos:

1. Descargue el [código del simulador](https://github.com/PEM-Humboldt/herramienta-resiliencia-simulador) en la misma ruta donde almacenó el [código del servidor](https://github.com/PEM-Humboldt/herramienta-resiliencia-servidor)
1. Configure las variables de ambiente:
   ```sh
   export PG_DATABASE=gis PG_USER=docker PG_PASSWORD=docker GS_USER=admin GS_PASS=geoserver GS_DATA_DIR='../geoserver_data' MODEL_OUPUTS_DIR='../model_outputs' MODEL_PASSWORD='model_password'
   ```
1. Ejecute docker-compose con el archivo de desarrollo:
   ```
   docker-compose -f docker-compose.dev.yml up -d
   ```

## Autores

- **Erika Suárez Valencia** - [erikasv](https://github.com/erikasv)

## Licencia

Este proyecto está licenciado bajo la licencia [MIT](LICENSE)

## Reconocimientos

Esta aplicación hace parte de los resultados del componente 2 del acuerdo No. 19-155 firmado entre el Instituto Humboldt y Ecopetrol [FIBRAS](http://humboldt.org.co/fibras/componente2.html)
