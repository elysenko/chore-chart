# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Serve the static placeholder page. When application code is added later, this
# COPY will pick up any additional files at the repo root.
COPY index.html /usr/share/nginx/html/index.html
COPY README.md /usr/share/nginx/html/README.md

# Overwrite the default site config to listen on 8080 with SPA fallback.
RUN printf 'server {\n  listen 8080;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' \
    > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
