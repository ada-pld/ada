FROM node:16

VOLUME [ "/usr/src/app/pldGenerator/custom/customGenerator", "/usr/src/app/pldGenerator/generated", "/usr/src/app/pldGenerator/assets" ]

WORKDIR /usr/src/app

RUN mkdir -p /usr/src/app/pldGenerator

COPY ./pldGenerator/package*.json /usr/src/app/pldGenerator/

RUN cd /usr/src/app/pldGenerator && \
    npm install --omit=dev && \
    npm cache clean --force

COPY ./package*.json /usr/src/app/

RUN cd /usr/src/app && \
    npm install && \
    npm cache clean --force

COPY ./ /usr/src/app/

RUN npm run buildMail && \
    npm run build && \
    chmod +x dockerEntrypoint.sh

EXPOSE 4000

ENTRYPOINT [ "/usr/src/app/dockerEntrypoint.sh" ]
CMD ["npm", "start"]
