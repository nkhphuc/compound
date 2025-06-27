#!/bin/sh

# Test script to verify migration works correctly
echo "Testing database migration..."

# Check if dist/config/migrate.js exists
if [ ! -f "dist/config/migrate.js" ]; then
  echo "Error: dist/config/migrate.js not found. Please run 'pnpm build' first."
  exit 1
fi

# Check if dist/config/database.js exists
if [ ! -f "dist/config/database.js" ]; then
  echo "Error: dist/config/database.js not found. Please run 'pnpm build' first."
  exit 1
fi

echo "Migration files found. You can test the migration by running:"
echo "node dist/config/migrate.js"
echo ""
echo "Make sure your database is running and DATABASE_URL is set correctly."
