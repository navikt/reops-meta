FROM cgr.dev/chainguard/nginx:latest
COPY docs/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080

