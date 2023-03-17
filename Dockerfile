FROM node:16 AS frontend
WORKDIR /tmp/frontendbuild
ENV FRONTEND_COMMIT a25c4a9f268c599253b7299574f00b2de1a37c2b
ARG VAR_NAME_HERE=${BASE_API_URL}
ARG VAR_NAME_HERE=${BASE_URL}
ARG VAR_NAME_HERE=${HOSTNAME}
RUN git clone https://github.com/protoxvga/wap_ui && \
    cd wap_ui && \ 
    git reset --hard ${FRONTEND_COMMIT} && \
    npm install && \
    npx next build && \
    npx next export && \
    cp -r out /tmp/out && \
    cd .. && \
    rm -rf wapui

FROM node:16 AS pldgenerator
WORKDIR /tmp/pldgeneratorbuild
COPY ./pldGenerator/package*.json ./
RUN npm install --omit=dev && \
    npm cache clean --force
COPY ./pldGenerator ./

FROM node:16 AS app
WORKDIR /tmp/app
COPY ./package*.json ./
RUN npm install && \
    npm cache clean --force
COPY ./ ./
RUN npm run buildMail && \
    npm run build
COPY ./ ./

FROM node:16
VOLUME [ "/usr/src/app/pldGenerator/custom/customGenerator", "/usr/src/app/pldGenerator/generated", "/usr/src/app/pldGenerator/assets" ]
WORKDIR /usr/src/app

COPY --from=app /tmp/app/ /usr/src/app/
COPY --from=frontend /tmp/out /usr/src/app/public2
COPY --from=pldgenerator /tmp/pldgeneratorbuild /usr/src/app/pldGenerator

EXPOSE 4000

ENTRYPOINT [ "/usr/src/app/dockerEntrypoint.sh" ]
CMD ["npm", "start"]
