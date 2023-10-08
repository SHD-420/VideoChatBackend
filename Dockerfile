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
ADD https://github.com/SHD-420/VideoChatFrontend.git#deploy /app/client

EXPOSE 8000

CMD ["pnpm","start"]