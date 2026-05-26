FROM node:20-alpine AS build

WORKDIR /app/apps/web

COPY apps/web/package*.json ./
RUN npm ci

COPY apps/web/ ./

ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf.template
COPY --from=build /app/dist/apps/web /usr/share/nginx/html

ENV BACKEND_URL=http://backend:5000

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --retries=5 CMD wget --spider -q http://127.0.0.1:3000/ || exit 1

CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
