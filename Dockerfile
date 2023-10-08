FROM node:18-slim AS base

# PNPM configuration
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules

# Include the client
FROM alpine:3.14
RUN git clone --depth=1 --branch=deploy https://github.com/SHD-420/VideoChatFrontend.git  /app/client
RUN rm -rf /app/client/.git

EXPOSE 8000

CMD ["pnpm","start"]