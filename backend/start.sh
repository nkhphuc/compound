#!/bin/sh

set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  echo "PostgreSQL is not ready yet, waiting..."
  sleep 2
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
if node dist/config/migrate.js; then
  echo "Database migration completed successfully"
else
  echo "Database migration failed"
  exit 1
fi

# Start the application
echo "Starting the application..."
exec node dist/index.js
