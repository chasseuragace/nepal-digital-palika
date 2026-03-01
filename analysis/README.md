# Analysis Scripts

This directory contains scripts for analyzing the Nepal Digital Tourism Infrastructure Documentation project.

## Available Scripts

### `sort_md_by_date.sh`
Analyzes and sorts all markdown files in the project by their last edited date.

#### Usage
```bash
# Run on current directory
./sort_md_by_date.sh

# Run on specific directory
./sort_md_by_date.sh /path/to/project
```

### `generate_report.sh`
Generates a comprehensive markdown analysis report in markdown format.

#### Usage
```bash
# Generate report for parent directory
./generate_report.sh .. "markdown_analysis_report.md"

# Generate report for specific directory with custom output file
./generate_report.sh /path/to/project "my_report.md"
```

#### Features
- Excludes `node_modules` and `.git` directories
- Shows files sorted by modification date (newest first)
- Displays filename and relative path
- Provides total file count
- Shows file distribution by month

#### Output Format
```
Date                | Filename                           | Directory Path
------------------- | ---------------------------------- | --------------------
2026-02-28 13:01:39 | QUICKSTART.md                      | platform-admin-panel
2026-02-28 13:01:39 | SUPABASE_ARCHITECTURE.md           | docs/03-architecture
...
```

## Requirements
- macOS (uses `stat` command with BSD format)
- Bash shell

## Example Output
Running the script will produce a sorted list of all markdown files with their modification dates, helping you identify:
- Most recently edited documentation
- Stale or outdated files
- Documentation activity patterns
