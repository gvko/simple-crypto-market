FROM node:14.5-buster-slim AS base
WORKDIR /app
COPY ./app/package*.json ./

FROM base AS local-dev
ADD ./app /app
RUN npm ci && npm cache clean --force
RUN chown -R root:root /app
RUN chmod a+rwx,g-w,o-w /app
USER node
CMD ["nodemon"]
