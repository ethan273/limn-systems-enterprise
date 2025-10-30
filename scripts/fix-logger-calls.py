#!/usr/bin/env python3
"""
Fix Pino logger call signatures to match proper format:
log.level(message: string, meta?: Record<string, any>)
"""

import re
import sys
from pathlib import Path

def fix_logger_call(match):
    """Fix a single logger call to proper format"""
    level = match.group(1)  # error, warn, info, debug
    args = match.group(2)   # everything between parentheses

    # Split arguments by comma (but not commas inside quotes or objects)
    arg_parts = []
    current_arg = ""
    paren_depth = 0
    brace_depth = 0
    in_string = False
    string_char = None

    for char in args:
        if char in ('"', "'", '`') and not in_string:
            in_string = True
            string_char = char
        elif char == string_char and in_string:
            in_string = False
            string_char = None
        elif char == '(' and not in_string:
            paren_depth += 1
        elif char == ')' and not in_string:
            paren_depth -= 1
        elif char == '{' and not in_string:
            brace_depth += 1
        elif char == '}' and not in_string:
            brace_depth -= 1
        elif char == ',' and not in_string and paren_depth == 0 and brace_depth == 0:
            arg_parts.append(current_arg.strip())
            current_arg = ""
            continue

        current_arg += char

    if current_arg.strip():
        arg_parts.append(current_arg.strip())

    # If already correct format (1 or 2 args, second is object), return as-is
    if len(arg_parts) <= 1:
        return match.group(0)

    if len(arg_parts) == 2:
        second_arg = arg_parts[1].strip()
        # Check if second arg is already an object literal
        if second_arg.startswith('{') and second_arg.endswith('}'):
            return match.group(0)

    # Fix needed: wrap additional arguments in metadata object
    message = arg_parts[0]
    rest_args = arg_parts[1:]

    # Create metadata object entries
    metadata_entries = []
    for i, arg in enumerate(rest_args):
        arg = arg.strip()
        # If it's a simple variable name, use it as shorthand property
        if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', arg):
            metadata_entries.append(arg)
        else:
            # For complex expressions, create numbered keys
            metadata_entries.append(f'arg{i + 1}: {arg}')

    # Build fixed call
    metadata_obj = '{ ' + ', '.join(metadata_entries) + ' }'
    fixed_call = f'log.{level}({message}, {metadata_obj})'

    return fixed_call

def fix_file(file_path):
    """Fix all logger calls in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Pattern to match log.level(...) calls
        # Matches: log.error(...), log.warn(...), log.info(...), log.debug(...)
        pattern = r'log\.(error|warn|info|debug)\(([^)]+(?:\([^)]*\))?[^)]*)\)'

        # Replace all matches
        content = re.sub(pattern, fix_logger_call, content)

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    except Exception as e:
        print(f'  ❌ Error processing {file_path}: {e}')
        return False

def main():
    # Get list of files with TypeScript errors
    import subprocess

    print('🔍 Finding files with logger signature errors...')

    try:
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            capture_output=True,
            text=True,
            env={'NODE_OPTIONS': '--max-old-space-size=8192'}
        )

        # Extract unique file paths from errors
        error_lines = [line for line in result.stderr.split('\n') if line.startswith('src/')]
        files = set()
        for line in error_lines:
            if '(' in line:
                file_path = line.split('(')[0]
                files.add(file_path)

        files = sorted(files)

        if not files:
            print('✅ No TypeScript errors found!')
            return 0

        print(f'📊 Found {len(files)} files with errors')
        print('🔧 Fixing logger signatures...\n')

        fixed_count = 0
        for i, file_path in enumerate(files, 1):
            if not Path(file_path).exists():
                continue

            print(f'[{i}/{len(files)}] Processing: {file_path}')
            if fix_file(file_path):
                fixed_count += 1
                print(f'  ✅ Fixed')
            else:
                print(f'  ⏭️  No changes')

        print(f'\n✅ Processing complete! Fixed {fixed_count} files')

        # Re-run TypeScript check to see remaining errors
        print('\n⚠️  Running TypeScript check to verify fixes...\n')
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            capture_output=True,
            text=True,
            env={'NODE_OPTIONS': '--max-old-space-size=8192'}
        )

        remaining_errors = len([line for line in result.stderr.split('\n') if line.startswith('src/')])
        print(f'\n📊 Remaining TypeScript errors: {remaining_errors}')

        if remaining_errors == 0:
            print('✅ All logger signature errors fixed!')
            return 0
        else:
            print('⚠️  Some errors remain - saving to /tmp/remaining-logger-errors.log')
            with open('/tmp/remaining-logger-errors.log', 'w') as f:
                f.write(result.stderr)
            return 1

    except Exception as e:
        print(f'❌ Error: {e}')
        return 1

if __name__ == '__main__':
    sys.exit(main())
