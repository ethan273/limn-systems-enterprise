import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface AriaLabelFix {
  file: string;
  line: number;
  icon: string;
  suggestedLabel: string;
}

// Icon to label mapping
const iconLabels: Record<string, string> = {
  'MoreVertical': 'Open options menu',
  'Edit': 'Edit',
  'Trash': 'Delete',
  'Eye': 'View details',
  'Plus': 'Add',
  'X': 'Close',
  'ChevronDown': 'Expand',
  'ChevronUp': 'Collapse',
  'ChevronLeft': 'Previous',
  'ChevronRight': 'Next',
  'Search': 'Search',
  'Filter': 'Filter',
  'Download': 'Download',
  'Upload': 'Upload',
  'Settings': 'Settings',
  'Bell': 'Notifications',
  'User': 'User menu',
  'MessageSquare': 'Messages',
  'Calendar': 'Calendar',
  'Clock': 'Time',
  'Check': 'Confirm',
  'AlertCircle': 'Alert',
  'Info': 'Information',
  'HelpCircle': 'Help',
  'Copy': 'Copy',
  'Share': 'Share',
  'Bookmark': 'Bookmark',
  'Star': 'Favorite',
  'Heart': 'Like',
  'ExternalLink': 'Open in new window',
  'ArrowLeft': 'Go back',
  'ArrowRight': 'Go forward',
  'RefreshCw': 'Refresh',
  'Save': 'Save',
  'Send': 'Send',
  'Paperclip': 'Attach file',
  'Image': 'Add image',
  'Video': 'Add video',
  'File': 'Add file',
  'Folder': 'Open folder',
  'Archive': 'Archive',
  'Lock': 'Lock',
  'Unlock': 'Unlock',
};

async function findIconButtonsWithoutAriaLabels() {
  const fixes: AriaLabelFix[] = [];

  // Find all TSX files
  const files = await glob('/Users/eko3/limn-systems-enterprise/src/**/*.tsx');

  console.log(`Scanning ${files.length} files for icon buttons without aria-labels...\\n`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern 1: <button> with icon, no aria-label
      if (line.includes('<button') && !line.includes('aria-label')) {
        // Check if next few lines have an icon component
        const contextLines = lines.slice(i, Math.min(i + 3, lines.length)).join('\\n');

        // Look for icon components
        const iconMatch = contextLines.match(/<(\\w+Icon|\\w+)\\s+className="[^"]*icon[^"]*"/);
        if (iconMatch) {
          const iconName = iconMatch[1].replace('Icon', '');
          const label = iconLabels[iconName] || `Action for ${iconName}`;

          fixes.push({
            file: file.replace('/Users/eko3/limn-systems-enterprise/', ''),
            line: i + 1,
            icon: iconMatch[1],
            suggestedLabel: label,
          });
        }
      }

      // Pattern 2: <Button> with icon, no aria-label
      if (line.includes('<Button') && line.includes('btn-icon') && !line.includes('aria-label')) {
        const contextLines = lines.slice(i, Math.min(i + 3, lines.length)).join('\\n');

        const iconMatch = contextLines.match(/<(\\w+)\\s+className="[^"]*icon[^"]*"/);
        if (iconMatch) {
          const iconName = iconMatch[1];
          const label = iconLabels[iconName] || `Action for ${iconName}`;

          fixes.push({
            file: file.replace('/Users/eko3/limn-systems-enterprise/', ''),
            line: i + 1,
            icon: iconMatch[1],
            suggestedLabel: label,
          });
        }
      }
    }
  }

  return fixes;
}

async function generateReport() {
  console.log('🔍 Finding icon buttons without aria-labels...\\n');

  const fixes = await findIconButtonsWithoutAriaLabels();

  console.log(`✅ Scan complete!`);
  console.log(`📊 Found ${fixes.length} icon buttons without aria-labels\\n`);

  // Group by file
  const byFile = fixes.reduce((acc, fix) => {
    if (!acc[fix.file]) {
      acc[fix.file] = [];
    }
    acc[fix.file].push(fix);
    return acc;
  }, {} as Record<string, AriaLabelFix[]>);

  // Generate markdown report
  const report = `# Icon Buttons Missing aria-labels

**Date**: ${new Date().toISOString().split('T')[0]}
**Total Issues**: ${fixes.length}
**Files Affected**: ${Object.keys(byFile).length}

## Summary by File

${Object.entries(byFile).map(([file, fileFixes]) => `### ${file}

**Issues**: ${fileFixes.length}

${fileFixes.map(fix => `- **Line ${fix.line}**: \`<${fix.icon}>\` → Add \`aria-label="${fix.suggestedLabel}"\``).join('\\n')}
`).join('\\n')}

## How to Fix

For each button with an icon:

\`\`\`tsx
// BEFORE (FAILS)
<button className="header-icon-button">
  <BellIcon className="w-5 h-5" />
</button>

// AFTER (PASSES)
<button className="header-icon-button" aria-label="Open notifications">
  <BellIcon className="w-5 h-5" aria-hidden="true" />
</button>
\`\`\`

**Key Points**:
1. Add \`aria-label\` to the \`<button>\` or \`<Button>\` element
2. Add \`aria-hidden="true"\` to the icon component
3. Use descriptive labels that explain the action

## Automated Fix Script

To apply these fixes automatically, you would need to:
1. Read each file
2. Find the button element at the specified line
3. Add the aria-label attribute
4. Add aria-hidden to the icon

This requires careful parsing to avoid breaking the code structure.
`;

  fs.writeFileSync('/Users/eko3/limn-systems-enterprise/reports/icon-buttons-aria-labels.md', report);

  console.log('📁 Report saved to: /reports/icon-buttons-aria-labels.md');
  console.log('\\n🎯 Next Steps:');
  console.log('1. Review the report');
  console.log('2. Manually add aria-labels to each icon button');
  console.log('3. Re-run accessibility tests to verify fixes');
}

generateReport().catch(console.error);
