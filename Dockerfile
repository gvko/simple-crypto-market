FROM node:14.5-buster-slim AS base
WORKDIR /app

FROM base AS local-dev
ADD ./app /app
RUN chown -R root:root /app
RUN chmod a+rwx,g-w,o-w /app
USER node
CMD ["npm", "run", "start-dev"]
