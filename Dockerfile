FROM node:18-slim AS base

# PNPM configuration
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY . /app
WORKDIR /app

# clone the client
FROM ubuntu:latest AS client
RUN apt-get -y update
RUN apt-get -y install git
RUN git clone --depth=1 --branch=deploy https://github.com/SHD-420/VideoChatFrontend.git  /app/client
RUN rm -rf /app/client/.git

# install node dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# copy node_modules from prod-deps
# and client from client stage
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=client /app/client /app/client

EXPOSE 8000

CMD ["pnpm","start"]