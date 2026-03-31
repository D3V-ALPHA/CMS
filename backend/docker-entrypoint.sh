#!/bin/sh
echo "Running database migrations..."
npx drizzle-kit migrate

# Then start the app
exec "$@"