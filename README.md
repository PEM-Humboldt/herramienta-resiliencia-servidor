# Servidor de la Herramienta de Resiliencia

Servicio para cargar capas geográficas en formato shp y disponerlas en formato FeatureServer o MapServer

## Prerrequisitos
El modo de uso recomendado es por medio de un contenedor de Docker (v20.10.8), y requiere de una base de datos PostGIS, la base de datos se puede ejecutar en un contenedor de la siguiente forma:
```
docker run -d --name db kartoza/postgis:13.0
```
Este comando crea por defecto una base de datos `gis`, con usuario `docker` y contraseña `docker`; se recomienda cambiar estos valores por defecto (ver cómo [aquí](https://hub.docker.com/r/kartoza/postgis)).

>Si se desean instalar todas las partes en un sistema sin usar el contenedor se requiere lo siguiente:
>- Node.js v16.13.0
>- shp2pgsql (incluído en la instalción de PostGIS)
>- Una base de datos PostGIS (v13.0)

## Cómo ejecutar [WIP]
1. Construir la imagen
    ```
    docker build -t server .
    ```
2. Ejecutar el contenedor
    ```
    docker run -d -p 3000:3000 --name server --link db:db -e PG_HOST=db -e PG_PORT=5432 -e PG_DATABASE=gis -e PG_USER=docker -e PG_PASSWORD=docker server
    ```
_[TODO] Ejecución sin docker_

## Modo desarrollo
Para el desarrollo también se recomienda usar Docker.
1. Construir la imagen
    ```
    docker build -f Dockerfile.dev -t server .
    ```
2. Ejecutar el contenedor
    ```
    docker run -d -p 3000:3000 --name server --link db:db -e PG_HOST=db -e PG_PORT=5432 -e PG_DATABASE=gis -e PG_USER=docker -e PG_PASSWORD=docker -v <application_path>:/home/node/app server
    ```

>Sin el contenedor [_Esto no se ha probado_]:
>1. Instalar dependencias:
>```
>npm install
>```
>2. Ejecutar la aplicación
>```
>PG_HOST=db PG_PORT=5432 PG_DATABASE=gis PG_USER=docker PG_PASSWORD=docker npm run dev
>```

## Autores
* **Erika Suárez Valencia** - [erikasv](https://github.com/erikasv)

## Licencia
Este proyecto está licenciado bajo la licencia [MIT](LICENSE)

## Reconocimientos

Esta aplicación hace parte de la herramienta del componente 2 del convenio [FIBRAS](http://humboldt.org.co/fibras/componente2.html) entre el Instituto Humboldt y Ecopetrol
