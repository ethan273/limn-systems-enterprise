#!/usr/bin/env python3
import os
import json
import subprocess
from pathlib import Path
from datetime import datetime

def count_lines_in_file(filepath):
    """Count lines in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return len(f.readlines())
    except:
        return 0

def analyze_codebase(root_path):
    """Analyze the entire codebase"""
    stats = {
        'total_files': 0,
        'total_lines': 0,
        'by_extension': {},
        'by_module': {},
        'test_files': 0,
        'test_lines': 0
    }
    
    extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.sql', '.prisma', '.json', '.md']
    
    for ext in extensions:
        stats['by_extension'][ext] = {'files': 0, 'lines': 0}
    
    # Main modules to analyze
    modules = ['app', 'components', 'lib', 'server', 'hooks', 'types', 'utils', 'modules']
    
    for module in modules:
        module_path = Path(root_path) / 'src' / module
        if module_path.exists():
            stats['by_module'][module] = {'files': 0, 'lines': 0}
            for root, dirs, files in os.walk(module_path):
                # Skip node_modules and build directories
                if 'node_modules' in root or '.next' in root:
                    continue
                for file in files:
                    filepath = os.path.join(root, file)
                    ext = os.path.splitext(file)[1]
                    if ext in extensions:
                        lines = count_lines_in_file(filepath)
                        stats['total_files'] += 1
                        stats['total_lines'] += lines
                        stats['by_extension'][ext]['files'] += 1
                        stats['by_extension'][ext]['lines'] += lines
                        stats['by_module'][module]['files'] += 1
                        stats['by_module'][module]['lines'] += lines
    
    # Count test files
    test_path = Path(root_path) / 'tests'
    if test_path.exists():
        for root, dirs, files in os.walk(test_path):
            for file in files:
                if file.endswith('.spec.ts') or file.endswith('.test.ts'):
                    filepath = os.path.join(root, file)
                    lines = count_lines_in_file(filepath)
                    stats['test_files'] += 1
                    stats['test_lines'] += lines
    
    return stats

def analyze_database(root_path):
    """Analyze database schema"""
    schema_path = Path(root_path) / 'prisma' / 'schema.prisma'
    
    if not schema_path.exists():
        return {'error': 'Schema file not found'}
    
    with open(schema_path, 'r') as f:
        content = f.read()
    
    # Count models
    models = content.count('model ')
    enums = content.count('enum ')
    
    return {
        'models': models,
        'enums': enums,
        'lines': len(content.split('\n'))
    }

def analyze_dependencies(root_path):
    """Analyze package.json dependencies"""
    package_path = Path(root_path) / 'package.json'
    
    if not package_path.exists():
        return {'error': 'package.json not found'}
    
    with open(package_path, 'r') as f:
        package = json.load(f)
    
    return {
        'dependencies': len(package.get('dependencies', {})),
        'devDependencies': len(package.get('devDependencies', {})),
        'total': len(package.get('dependencies', {})) + len(package.get('devDependencies', {}))
    }

def generate_report(root_path):
    """Generate comprehensive report"""
    print("Analyzing Limn Systems Enterprise Application...")
    print("=" * 70)
    
    # Code analysis
    code_stats = analyze_codebase(root_path)
    
    print("\n📊 CODE STATISTICS")
    print("-" * 40)
    print(f"Total Files: {code_stats['total_files']:,}")
    print(f"Total Lines of Code: {code_stats['total_lines']:,}")
    print(f"Test Files: {code_stats['test_files']:,}")
    print(f"Test Lines: {code_stats['test_lines']:,}")
    
    print("\n📁 BY FILE TYPE")
    print("-" * 40)
    for ext, data in sorted(code_stats['by_extension'].items(), key=lambda x: x[1]['lines'], reverse=True):
        if data['files'] > 0:
            print(f"{ext:10} {data['files']:5,} files   {data['lines']:8,} lines")
    
    print("\n🏗️ BY MODULE")
    print("-" * 40)
    for module, data in sorted(code_stats['by_module'].items(), key=lambda x: x[1]['lines'], reverse=True):
        if data['files'] > 0:
            print(f"{module:15} {data['files']:5,} files   {data['lines']:8,} lines")
    
    # Database analysis
    db_stats = analyze_database(root_path)
    
    print("\n🗄️ DATABASE SCHEMA")
    print("-" * 40)
    if 'error' not in db_stats:
        print(f"Prisma Models: {db_stats['models']}")
        print(f"Enums: {db_stats['enums']}")
        print(f"Schema Lines: {db_stats['lines']:,}")
    
    # Dependencies analysis
    dep_stats = analyze_dependencies(root_path)
    
    print("\n📦 DEPENDENCIES")
    print("-" * 40)
    if 'error' not in dep_stats:
        print(f"Production Dependencies: {dep_stats['dependencies']}")
        print(f"Dev Dependencies: {dep_stats['devDependencies']}")
        print(f"Total Packages: {dep_stats['total']}")
    
    # Save to JSON
    report = {
        'generated': datetime.now().isoformat(),
        'code': code_stats,
        'database': db_stats,
        'dependencies': dep_stats
    }
    
    with open(Path(root_path) / 'app-analysis.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print("\n✅ Analysis complete! Report saved to app-analysis.json")

if __name__ == "__main__":
    root_path = "/Users/eko3/limn-systems-enterprise"
    generate_report(root_path)
