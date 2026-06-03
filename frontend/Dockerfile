FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=$BACKEND_URL

# Baked into the static bundle so the browser can see it. Empty means the
# Google sign-in button just won't render.
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
