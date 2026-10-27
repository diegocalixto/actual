FROM node:24-bookworm AS deps

# Install required packages
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy only the files needed for installing dependencies
COPY .yarn ./.yarn
COPY yarn.lock package.json .yarnrc.yml tsconfig.json lage.config.js ./
COPY packages/api/package.json packages/api/package.json
COPY packages/component-library/package.json packages/component-library/package.json
COPY packages/crdt/package.json packages/crdt/package.json
COPY packages/desktop-client/package.json packages/desktop-client/package.json
COPY packages/desktop-electron/package.json packages/desktop-electron/package.json
COPY packages/eslint-plugin-actual/package.json packages/eslint-plugin-actual/package.json
COPY packages/loot-core/package.json packages/loot-core/package.json
COPY packages/sync-server/package.json packages/sync-server/package.json
COPY packages/plugins-service/package.json packages/plugins-service/package.json
COPY packages/vite-plugin-peggy/package.json packages/vite-plugin-peggy/package.json

COPY ./bin/package-browser ./bin/package-browser

RUN yarn install

FROM deps AS builder

WORKDIR /app

COPY packages/ ./packages/

# Increase memory limit for the build process to 8GB
ENV NODE_OPTIONS=--max_old_space_size=8192

# lage's task hasher invokes `git ls-tree HEAD` during initialization, so it
# needs a git repo even when individual targets disable caching. .dockerignore
# omits the real .git, so seed a throwaway repo with a single commit here.
RUN git -c init.defaultBranch=master init -q \
    && git -c user.email=build@docker -c user.name=docker-build add -A \
    && git -c user.email=build@docker -c user.name=docker-build commit -qm build

RUN yarn build:server

# Diego Finance: the Node build of the Actual API (the app's own core, from this
# same commit) for the daily bank sync in deploy/sincronizacao-bancaria. No
# source maps; the package.json keeps it CommonJS under /app's "type": "module".
RUN yarn workspace @actual-app/api vite build \
    && rm -f packages/api/dist/*.map \
    && echo '{"type":"commonjs"}' > packages/api/dist/package.json

# Focus the workspaces in production mode (including @actual-app/web you just built)
RUN yarn workspaces focus @actual-app/sync-server --production

# Remove symbolic links for @actual-app/web and @actual-app/sync-server
RUN rm -rf ./node_modules/@actual-app/web ./node_modules/@actual-app/sync-server

# Copy in the @actual-app/web artifacts manually, so we don't need the entire packages folder
COPY ./packages/desktop-client/package.json ./node_modules/@actual-app/web/package.json
RUN cp -r ./packages/desktop-client/build ./node_modules/@actual-app/web/build

FROM node:24-bookworm-slim AS prod

# Minimal runtime dependencies
RUN apt-get update && apt-get install -y tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Create a non-root user
ARG USERNAME=actual
ARG USER_UID=1001
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && mkdir /data && chown -R ${USERNAME}:${USERNAME} /data

WORKDIR /app
ENV NODE_ENV=production

# Pull in only the necessary artifacts (built node_modules, server files, etc.)
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/sync-server/package.json ./
COPY --from=builder /app/packages/sync-server/build ./build

# Diego Finance: the daily bank sync and the API it drives. The server never
# loads them; they run only as their own service (the "sincronizacao" profile
# in deploy/docker-compose.yml).
COPY --from=builder /app/packages/api/dist ./sincronizacao-bancaria/api
COPY deploy/sincronizacao-bancaria/rotina.mjs deploy/sincronizacao-bancaria/politica.mjs ./sincronizacao-bancaria/

ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
EXPOSE 5006
CMD ["node", "build/app.js"]
