FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    git \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

USER node

WORKDIR /workspace