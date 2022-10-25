FROM node:16

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm install

COPY ./ ./

WORKDIR /usr/src/app/pldGenerator

RUN npm install

WORKDIR /usr/src/app

RUN npm run buildMail

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
