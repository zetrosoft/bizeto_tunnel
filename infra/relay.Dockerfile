FROM alpine:latest
WORKDIR /app
RUN adduser -D -u 1000 bizeto
COPY --chown=bizeto:bizeto relay .
COPY --chown=bizeto:bizeto .env .
RUN mkdir -p /app/data && chown -R bizeto:bizeto /app/data
USER bizeto
EXPOSE 80 443 4321 8080
CMD ["./relay"]
