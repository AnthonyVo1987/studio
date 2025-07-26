#!/usr/bin/env python3
"""
Source Code Token Count Audit Script for StockSage v3.7.4.4
Analyzes ONLY the src/ folder for actual source code tokens
Excludes all documentation, config, and build artifacts
"""

import os
from datetime import datetime
import json
from collections import defaultdict
from typing import Dict, List, Tuple

def count_tokens_approx(text: str) -> int:
    """Approximate token count (1 token ≈ 4 characters)"""
    return len(text) // 4

def analyze_file(filepath: str) -> Tuple[int, int, int]:
    """Analyze a single file and return character count, token count, and line count"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            chars = len(content)
            tokens = count_tokens_approx(content)
            lines = len(content.splitlines())
            return chars, tokens, lines
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0, 0, 0

def is_source_code_file(filepath: str) -> bool:
    """Check if a file is actual source code"""
    # Include only actual source code extensions
    source_extensions = {'.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.json'}
    ext = os.path.splitext(filepath)[1].lower()
    return ext in source_extensions

def get_src_files(src_dir: str) -> List[str]:
    """Get all source files in the src/ directory"""
    source_files = []
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            filepath = os.path.join(root, file)
            if is_source_code_file(filepath):
                source_files.append(filepath)
    
    return source_files

def categorize_files(files: List[str]) -> Dict[str, List[str]]:
    """Categorize files by type/extension"""
    categories = defaultdict(list)
    
    for filepath in files:
        ext = os.path.splitext(filepath)[1].lower()
        if not ext:
            ext = 'no_extension'
        categories[ext].append(filepath)
    
    return dict(categories)

def get_directory_breakdown(files: List[str], project_root: str) -> Dict[str, Dict]:
    """Get token breakdown by subdirectory within src/"""
    dir_stats = defaultdict(lambda: {'files': 0, 'tokens': 0, 'lines': 0, 'chars': 0})
    
    for filepath in files:
        rel_path = os.path.relpath(filepath, project_root)
        dir_path = os.path.dirname(rel_path)
        
        chars, tokens, lines = analyze_file(filepath)
        dir_stats[dir_path]['files'] += 1
        dir_stats[dir_path]['tokens'] += tokens
        dir_stats[dir_path]['lines'] += lines
        dir_stats[dir_path]['chars'] += chars
    
    return dict(dir_stats)

def main():
    # Focus only on src directory
    project_root = "/mnt/d/Github/studio"
    src_dir = os.path.join(project_root, "src")
    
    if not os.path.exists(src_dir):
        print(f"Error: src directory not found at {src_dir}")
        return
    
    print(f"Source Code Token Audit - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Project: StockSage v3.7.4.4")
    print(f"Analysis Scope: src/ folder ONLY")
    print(f"Root: {src_dir}")
    print("Note: Using approximation of 1 token ≈ 4 characters")
    print("=" * 80)
    
    # Get all source files
    print("\nScanning src/ folder for source code files...")
    source_files = get_src_files(src_dir)
    
    print(f"Found {len(source_files)} source files in src/")
    
    # Categorize files
    categories = categorize_files(source_files)
    
    # Get directory breakdown
    dir_breakdown = get_directory_breakdown(source_files, project_root)
    
    # Analyze each category
    print("\n" + "=" * 80)
    print("TOKEN COUNT BY FILE TYPE")
    print("=" * 80)
    
    total_chars = 0
    total_tokens = 0
    total_lines = 0
    category_stats = {}
    
    for ext, files in sorted(categories.items()):
        cat_chars = 0
        cat_tokens = 0
        cat_lines = 0
        
        for filepath in files:
            chars, tokens, lines = analyze_file(filepath)
            cat_chars += chars
            cat_tokens += tokens
            cat_lines += lines
        
        total_chars += cat_chars
        total_tokens += cat_tokens
        total_lines += cat_lines
        
        category_stats[ext] = {
            'files': len(files),
            'characters': cat_chars,
            'tokens': cat_tokens,
            'lines': cat_lines,
            'avg_tokens_per_file': cat_tokens // len(files) if files else 0
        }
        
        print(f"\n{ext.upper() if ext != 'no_extension' else 'NO EXTENSION'} Files:")
        print(f"  Files: {len(files)}")
        print(f"  Characters: {cat_chars:,}")
        print(f"  Tokens (approx): {cat_tokens:,}")
        print(f"  Lines: {cat_lines:,}")
        print(f"  Avg tokens/file: {cat_tokens // len(files) if files else 0:,}")
    
    # Directory breakdown
    print("\n" + "=" * 80)
    print("TOKEN COUNT BY DIRECTORY")
    print("=" * 80)
    
    sorted_dirs = sorted(dir_breakdown.items(), key=lambda x: x[1]['tokens'], reverse=True)
    for dir_path, stats in sorted_dirs:
        print(f"\n{dir_path}:")
        print(f"  Files: {stats['files']}")
        print(f"  Tokens: {stats['tokens']:,}")
        print(f"  Lines: {stats['lines']:,}")
        print(f"  Percentage: {(stats['tokens'] / total_tokens * 100):.1f}%")
    
    # Top files by token count
    print("\n" + "=" * 80)
    print("TOP 20 SOURCE FILES BY TOKEN COUNT")
    print("=" * 80)
    
    file_stats = []
    for filepath in source_files:
        chars, tokens, lines = analyze_file(filepath)
        if tokens > 0:
            rel_path = os.path.relpath(filepath, project_root)
            file_stats.append((rel_path, chars, tokens, lines))
    
    file_stats.sort(key=lambda x: x[2], reverse=True)  # Sort by tokens
    
    for i, (filepath, chars, tokens, lines) in enumerate(file_stats[:20], 1):
        print(f"{i:2d}. {filepath}")
        print(f"    Tokens: {tokens:,} | Lines: {lines:,} | Chars: {chars:,}")
    
    # Summary statistics
    print("\n" + "=" * 80)
    print("SOURCE CODE SUMMARY STATISTICS")
    print("=" * 80)
    print(f"Total Source Files: {len(source_files)}")
    print(f"Total Characters: {total_chars:,}")
    print(f"Total Tokens (approx): {total_tokens:,}")
    print(f"Total Lines: {total_lines:,}")
    print(f"Average Tokens/File: {total_tokens // len(source_files) if source_files else 0:,}")
    print(f"Average Lines/File: {total_lines // len(source_files) if source_files else 0:,}")
    
    # Export results
    results = {
        'timestamp': datetime.now().isoformat(),
        'version': 'v3.7.4.4',
        'analysis_scope': 'src/ folder only',
        'total_source_files': len(source_files),
        'total_characters': total_chars,
        'total_tokens_approx': total_tokens,
        'total_lines': total_lines,
        'token_estimation_method': '1 token ≈ 4 characters',
        'category_stats': category_stats,
        'directory_breakdown': dir_breakdown,
        'top_files': [(f, c, t, l) for f, c, t, l in file_stats[:20]]
    }
    
    output_file = os.path.join(project_root, 'docs', 'token_audit_src_only.json')
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults exported to: {output_file}")
    
    # Show token budget analysis
    print("\n" + "=" * 80)
    print("TOKEN BUDGET ANALYSIS (Source Code Only)")
    print("=" * 80)
    
    # Common context window sizes
    context_windows = {
        'GPT-4': 128_000,
        'GPT-4-32k': 32_000,
        'Claude-3': 200_000,
        'Claude-2.1': 100_000,
        'Gemini-1.5-Pro': 1_000_000,
    }
    
    for model, window_size in context_windows.items():
        percentage = (total_tokens / window_size) * 100
        remaining = window_size - total_tokens
        print(f"\n{model} ({window_size:,} tokens):")
        print(f"  Source code uses: {percentage:.1f}% of context")
        print(f"  Remaining: {remaining:,} tokens")
        if percentage < 70:
            print(f"  Status: ✅ EXCELLENT")
        elif percentage < 85:
            print(f"  Status: ✅ GOOD")
        elif percentage < 95:
            print(f"  Status: ⚠️ APPROACHING LIMIT")
        else:
            print(f"  Status: ❌ EXCEEDS LIMIT")

if __name__ == '__main__':
    main()