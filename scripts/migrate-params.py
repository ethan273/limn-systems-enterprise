#!/usr/bin/env python3
"""
Next.js 15 Params Migration Script
Converts all dynamic route pages to use Promise<params> pattern
"""

import re
import sys
from pathlib import Path

def detect_param_name(content):
    """Detect if param is 'id' or 'trackingNumber'"""
    if '[trackingNumber]' in content or 'trackingNumber' in content:
        return 'trackingNumber'
    return 'id'

def already_migrated(content):
    """Check if file already uses use(params) pattern"""
    return 'use(params)' in content or 'const resolvedParams = use(params)' in content

def uses_params_prop(content):
    """Check if file uses params prop pattern"""
    # Look for interface with params or direct params in function signature
    return bool(re.search(r'params:\s*\{', content) or
                re.search(r'}\s*{\s*params\s*}:', content) or
                re.search(r'function.*\{\s*params\s*}:', content))

def migrate_file(file_path):
    """Migrate a single file to Next.js 15 params pattern"""
    print(f"\nProcessing: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        original_content = f.read()

    # Check if already migrated
    if already_migrated(original_content):
        print("  ✓ Already migrated - skipping")
        return False

    content = original_content
    param_name = detect_param_name(content)
    print(f"  → Detected param name: {param_name}")

    # Step 1: Add 'use' to React imports if not present
    if 'from "react"' in content or "from 'react'" in content:
        # Check if 'use' is already imported
        if not re.search(r'import\s*\{[^}]*\buse\b[^}]*\}\s*from\s*["\']react["\']', content):
            # Find React import and add 'use'
            content = re.sub(
                r'(import\s*\{)([^}]*)(}\s*from\s*["\']react["\'])',
                r'\1 use, \2\3',
                content,
                count=1
            )
            print("  → Added 'use' to React imports")

    # Step 2: Handle params prop pattern
    if uses_params_prop(content):
        print("  → Using params prop pattern")

        # Update interface definition
        # Pattern: params: { id: string }
        # Replace with: params: Promise<{ id: string }>
        content = re.sub(
            rf'params:\s*\{{\s*{param_name}:\s*string\s*\}}',
            rf'params: Promise<{{ {param_name}: string }}>',
            content
        )
        print(f"  → Updated interface to use Promise<{{ {param_name}: string }}>")

        # Find the component function and add unwrapping
        # Look for function signature
        func_match = re.search(
            r'(export\s+default\s+function\s+\w+\s*\([^)]*params[^)]*\)\s*\{)',
            content
        )

        if func_match:
            func_end = func_match.end()
            # Insert unwrapping statement after opening brace
            # Find the next newline and insert there
            next_newline = content.find('\n', func_end)
            if next_newline != -1:
                indent = '  '  # Standard 2-space indent
                unwrap_statement = f'{indent}const {{ {param_name} }} = use(params);\n'
                content = content[:next_newline+1] + unwrap_statement + content[next_newline+1:]
                print(f"  → Added const {{ {param_name} }} = use(params);")

            # Replace all params.id with just id
            content = re.sub(rf'\bparams\.{param_name}\b', param_name, content)
            print(f"  → Replaced all params.{param_name} with {param_name}")

    # Step 3: Handle useParams() hook pattern
    elif 'useParams()' in content:
        print("  → Using useParams() hook pattern - converting to params prop")

        # Remove useParams import
        content = re.sub(r',?\s*useParams\s*', '', content)
        content = re.sub(r'useParams\s*,?\s*', '', content)
        print("  → Removed useParams from imports")

        # Remove useParams() call
        content = re.sub(
            rf'const\s+params\s*=\s*useParams\(\);\s*\n',
            '',
            content
        )

        # Remove taskId/orderId/etc variable extraction if exists
        old_id_patterns = [
            rf'const\s+{param_name}\s*=\s*params\.{param_name}\s+as\s+string;\s*\n',
            rf'const\s+{param_name}\s*=\s*params\?\.{param_name}\s+as\s+string;\s*\n',
            rf'const\s+taskId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+orderId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+paymentId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+invoiceId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+shipmentId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+inspectionId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+jobId\s*=\s*params\.id\s+as\s+string;\s*\n',
            rf'const\s+documentId\s*=\s*params\.id\s+as\s+string;\s*\n',
        ]
        for pattern in old_id_patterns:
            content = re.sub(pattern, '', content)

        print("  → Removed useParams() call and old variable extractions")

        # Add interface for params
        # Find export default function and add interface before it
        func_match = re.search(
            r'(export\s+const\s+dynamic\s*=.*?;\s*\n+)?(export\s+default\s+function\s+\w+)',
            content,
            re.DOTALL
        )

        if func_match:
            insert_pos = func_match.start(2)
            interface_code = f'''interface PageProps {{
  params: Promise<{{ {param_name}: string }}>;
}}

'''
            content = content[:insert_pos] + interface_code + content[insert_pos:]
            print(f"  → Added PageProps interface")

            # Update function signature to accept params
            content = re.sub(
                r'(export\s+default\s+function\s+\w+)\(\)',
                r'\1({ params }: PageProps)',
                content,
                count=1
            )
            print("  → Updated function signature to accept params")

            # Add unwrapping statement at beginning of function
            func_match = re.search(
                r'(export\s+default\s+function\s+\w+\([^)]*\)\s*\{)',
                content
            )
            if func_match:
                func_end = func_match.end()
                next_newline = content.find('\n', func_end)
                if next_newline != -1:
                    indent = '  '
                    unwrap_statement = f'{indent}const {{ {param_name} }} = use(params);\n'
                    content = content[:next_newline+1] + unwrap_statement + content[next_newline+1:]
                    print(f"  → Added const {{ {param_name} }} = use(params);")

        # Replace specific ID variable names with just 'id'
        id_replacements = {
            'taskId': 'id',
            'orderId': 'id',
            'paymentId': 'id',
            'invoiceId': 'id',
            'shipmentId': 'id',
            'inspectionId': 'id',
            'jobId': 'id',
            'documentId': 'id',
        }

        for old_var, new_var in id_replacements.items():
            # Only replace as complete word boundaries
            content = re.sub(rf'\b{old_var}\b', new_var, content)

        print("  → Replaced ID variable references")

    else:
        print("  ⚠ Unknown pattern - skipping")
        return False

    # Write the modified content
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  ✓ Migration complete")
        return True
    else:
        print("  - No changes made")
        return False

def main():
    """Main migration function"""
    # List of all dynamic route files
    files = [
        "/Users/eko3/limn-systems-enterprise/src/app/crm/contacts/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/crm/customers/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/crm/leads/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/crm/projects/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/crm/prospects/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/design/boards/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/design/briefs/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/design/projects/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/documents/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/financials/invoices/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/financials/payments/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/partners/designers/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/partners/factories/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/portal/designer/projects/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/portal/factory/orders/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/portal/orders/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/production/factory-reviews/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/production/orders/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/production/packing/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/production/prototypes/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/production/qc/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/production/shop-drawings/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/products/catalog/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/products/collections/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/products/concepts/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/products/prototypes/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/shipping/shipments/[id]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/shipping/tracking/[trackingNumber]/page.tsx",
        "/Users/eko3/limn-systems-enterprise/src/app/tasks/[id]/page.tsx",
    ]

    print("=" * 80)
    print("Next.js 15 Params Migration Script")
    print("=" * 80)

    modified_files = []
    skipped_files = []

    for file_path in files:
        if Path(file_path).exists():
            if migrate_file(file_path):
                modified_files.append(file_path)
            else:
                skipped_files.append(file_path)
        else:
            print(f"\n⚠ File not found: {file_path}")
            skipped_files.append(file_path)

    print("\n" + "=" * 80)
    print("Migration Summary")
    print("=" * 80)
    print(f"Total files: {len(files)}")
    print(f"Modified: {len(modified_files)}")
    print(f"Skipped/Already migrated: {len(skipped_files)}")

    if modified_files:
        print("\nModified files:")
        for f in modified_files:
            print(f"  ✓ {f}")

    return 0 if len(modified_files) > 0 else 1

if __name__ == "__main__":
    sys.exit(main())
