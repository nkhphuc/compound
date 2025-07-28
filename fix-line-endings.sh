#!/bin/bash

# Script to fix line ending issues in shell scripts
# This converts Windows CRLF line endings to Unix LF line endings

echo "🔧 Fixing line endings in shell scripts..."

# Function to fix line endings for a file
fix_line_endings() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Fixing line endings in $file..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's/\r$//' "$file"
        else
            # Linux
            sed -i 's/\r$//' "$file"
        fi
        echo "✅ Fixed line endings in $file"
    else
        echo "⚠️  File $file not found"
    fi
}

# Fix common shell scripts
fix_line_endings "minio-init.sh"
fix_line_endings "deploy.sh"
fix_line_endings "start.sh"

# Check if any other .sh files exist and fix them
for file in *.sh; do
    if [ -f "$file" ]; then
        fix_line_endings "$file"
    fi
done

echo "🎉 Line ending fixes completed!"
echo ""
echo "To verify the fixes, run:"
echo "  file *.sh"
echo ""
echo "To restart MinIO initialization:"
echo "  docker-compose restart minio-init"
