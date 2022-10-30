FROM node:16

WORKDIR /usr/src/app

VOLUME [ "/usr/src/app/pldGenerator/custom/customGenerator", "/usr/src/app/pldGenerator/generated" ]

COPY ./package*.json ./

RUN npm install

COPY ./ ./

WORKDIR /usr/src/app/pldGenerator

RUN npm install

WORKDIR /usr/src/app

RUN npm run buildMail

RUN npm run build

RUN npx sequelize db:migrate

EXPOSE 4000

CMD ["npm", "start"]
