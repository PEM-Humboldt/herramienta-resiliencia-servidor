FROM node:16-buster

RUN apt-get update && apt-get install -y postgis  zip

USER node

RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY . /home/node/app
RUN npm install --production

CMD npm start
EXPOSE 3000
