FROM node:16

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm install

COPY ./ ./

RUN npm run buildMail

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
