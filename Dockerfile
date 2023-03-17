FROM node:16 AS frontend
WORKDIR /tmp/frontendbuild
ENV FRONTEND_COMMIT 558b3c62fd9b60eeb4f5574a2ddf415ce15bcfc8
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
    npm run build && \
    chmod +x dockerEntrypoint.sh
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
