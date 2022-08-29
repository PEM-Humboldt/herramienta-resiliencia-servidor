FROM node:16-buster

RUN apt-get update && apt-get install -y postgis zip libaio1 

RUN wget https://download.oracle.com/otn_software/linux/instantclient/217000/instantclient-basic-linux.x64-21.7.0.0.0dbru.zip \
    && unzip instantclient-basic-linux.x64-21.7.0.0.0dbru.zip -d /opt/oracle/ \
    && cd /opt/oracle/instantclient* \
    && rm -f *jdbc* *occi* *mysql* *README *jar uidrvci genezi adrci \
    && echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

USER node

RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY . /home/node/app
RUN npm ci

CMD npm start
EXPOSE 3000
