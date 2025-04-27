FROM node:20

ENV UID=991 GID=991

ENV MONGOKU_DEFAULT_HOST="mongodb://localhost:27017"
ENV MONGOKU_SERVER_PORT=3100
ENV MONGOKU_DATABASE_FILE="/tmp/mongoku.db"
ENV MONGOKU_COUNT_TIMEOUT=5000
ARG READ_ONLY=false
ENV MONGOKU_READ_ONLY_MODE=$READ_ONLY

RUN mkdir -p /mongorai
WORKDIR /mongorai

COPY ./ /mongorai

RUN npm install -g typescript@5.8.2 \
      && npm ci \
      && cd app \
      && npm ci \
      && npm run build \
      && cd .. \
      && tsc

EXPOSE 3100

LABEL description="MongoDB client for the web. Query your data directly from your browser. You can host it locally, or anywhere else, for you and your team."

ENTRYPOINT node dist/server.js
