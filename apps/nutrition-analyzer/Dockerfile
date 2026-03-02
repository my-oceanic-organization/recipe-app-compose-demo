FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /nutrition-analyzer .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /nutrition-analyzer /usr/local/bin/nutrition-analyzer

EXPOSE 8080
CMD ["nutrition-analyzer"]
