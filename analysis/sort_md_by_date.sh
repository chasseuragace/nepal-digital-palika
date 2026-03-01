#!/bin/bash

# Script to analyze and sort markdown files by last edited date
# Usage: ./sort_md_by_date.sh [directory_path]

# Set the base directory - default to current directory or use first argument
BASE_DIR="${1:-$(pwd)}"

# Check if directory exists
if [ ! -d "$BASE_DIR" ]; then
    echo "Error: Directory '$BASE_DIR' does not exist."
    exit 1
fi

echo "Analyzing markdown files in: $BASE_DIR"
echo "=================================================="
echo ""

# Find all markdown files, exclude node_modules and .git directories
# Sort by modification time (newest first)
find "$BASE_DIR" -name "*.md" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -exec stat -f "%Sm|%N" -t "%Y-%m-%d %H:%M:%S" {} \; | \
    sort -r | \
    while IFS='|' read -r date file; do
        # Extract relative path and filename
        relative_path=$(echo "$file" | sed "s|$BASE_DIR/||")
        filename=$(basename "$file")
        dirname=$(dirname "$relative_path")
        
        # Format output
        printf "%-20s | %-35s | %s\n" "$date" "$filename" "$dirname"
    done

echo ""
echo "=================================================="
echo "Analysis complete!"

# Additional statistics
total_files=$(find "$BASE_DIR" -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l | tr -d ' ')
echo "Total markdown files found: $total_files"

# Show files by month
echo ""
echo "Files by month:"
find "$BASE_DIR" -name "*.md" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -exec stat -f "%Sm" -t "%Y-%m" {} \; | \
    sort | uniq -c | sort -r
