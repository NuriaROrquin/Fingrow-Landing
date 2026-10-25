FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_APP_URL
ARG VITE_CONTACT_EMAIL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx tsc --noEmit && npx vite build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
