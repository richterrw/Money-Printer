# Money Printer mobile app — runs anywhere that speaks Docker.
# The generator/finder have zero runtime dependencies, so this stays tiny.
FROM node:20-alpine

WORKDIR /app
COPY package.json ./
# No dependencies to install, but this keeps the layer cache friendly.
RUN npm install --omit=dev || true

COPY . .

ENV PORT=4000 HOST=0.0.0.0
EXPOSE 4000

# Set GOOGLE_PLACES_API_KEY at runtime for live data:
#   docker run -e GOOGLE_PLACES_API_KEY=xxx -p 4000:4000 money-printer
CMD ["node", "src/server.js"]
