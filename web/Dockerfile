FROM node:22-slim
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 4173
CMD ["pnpm", "preview", "--host", "--port", "4173"]
