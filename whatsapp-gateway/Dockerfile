FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache git wget

COPY package.json package.json
RUN npm install --omit=dev

COPY src src

ENV PORT=3001 \
    BAILEYS_AUTH_DIR=/app/auth

EXPOSE 3001

CMD ["npm", "start"]
