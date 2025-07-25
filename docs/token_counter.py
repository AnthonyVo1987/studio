#!/usr/bin/env python3
"""
Token Counter for StockSage Codebase
====================================
This script performs comprehensive token counting analysis on the StockSage source code.
It calculates the total tokens needed for AI coding agents to load the codebase into their context window.

Usage: python3 token_counter.py

Note: This script should be run from the project root directory.
"""

import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

class TokenCounter:
    def __init__(self, base_path: str = "."):
        self.base_path = os.path.abspath(base_path)
        self.exclude_paths = [
            "*/node_modules/*",
            "*/docs/*",
            "*/.next/*",
            "*/dist/*",
            "*/.genkit/runtimes/*"
        ]
        self.exclude_files = [
            "package-lock.json",
            "*backup*"
        ]
        
    def count_tokens(self, text: str) -> int:
        """
        Estimate tokens using character count approximation.
        - Code (TS/JS/JSON): ~4 characters per token
        - CSS: ~5 characters per token
        """
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', text.strip())
        return max(1, len(cleaned))
    
    def find_files(self, extensions: List[str]) -> List[str]:
        """Find all files with given extensions, excluding specified paths."""
        files = []
        
        # Build find command
        cmd = ["find", self.base_path, "-type", "f"]
        
        # Add extension filters
        if len(extensions) > 1:
            cmd.append("(")
            for i, ext in enumerate(extensions):
                if i > 0:
                    cmd.append("-o")
                cmd.extend(["-name", f"*.{ext}"])
            cmd.append(")")
        else:
            cmd.extend(["-name", f"*.{extensions[0]}"])
        
        # Add exclusions
        for path in self.exclude_paths:
            cmd.extend(["!", "-path", path])
            
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            files = [f for f in result.stdout.strip().split('\n') if f]
            
            # Filter out excluded files
            filtered_files = []
            for file in files:
                exclude = False
                for pattern in self.exclude_files:
                    if pattern in os.path.basename(file):
                        exclude = True
                        break
                if not exclude:
                    filtered_files.append(file)
                    
            return filtered_files
        except subprocess.CalledProcessError:
            return []
    
    def analyze_file(self, file_path: str) -> Tuple[int, int]:
        """Analyze a single file and return (character_count, size_bytes)."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                return len(content), os.path.getsize(file_path)
        except Exception:
            return 0, 0
    
    def run_audit(self) -> None:
        """Run the complete token audit and print results."""
        print("🔍 COMPREHENSIVE SOURCE CODE TOKEN AUDIT")
        print("=" * 60)
        print(f"Generated: {datetime.now().strftime('%a %b %d %H:%M:%S %Z %Y')}")
        print(f"Base Path: {self.base_path}")
        print()
        
        # Define file categories
        categories = {
            "TypeScript/JavaScript": {
                "extensions": ["ts", "tsx", "js", "jsx"],
                "chars_per_token": 4,
                "files": [],
                "total_chars": 0,
                "total_tokens": 0
            },
            "JSON Configurations": {
                "extensions": ["json"],
                "chars_per_token": 4,
                "files": [],
                "total_chars": 0,
                "total_tokens": 0
            },
            "CSS/Styling": {
                "extensions": ["css", "scss"],
                "chars_per_token": 5,
                "files": [],
                "total_chars": 0,
                "total_tokens": 0
            }
        }
        
        # Analyze each category
        for category_name, category_data in categories.items():
            files = self.find_files(category_data["extensions"])
            
            for file_path in files:
                chars, size = self.analyze_file(file_path)
                if chars > 0:
                    rel_path = os.path.relpath(file_path, self.base_path)
                    category_data["files"].append({
                        "path": rel_path,
                        "chars": chars,
                        "size": size,
                        "tokens": chars // category_data["chars_per_token"]
                    })
                    category_data["total_chars"] += chars
            
            # Calculate tokens for category
            if category_data["total_chars"] > 0:
                category_data["total_tokens"] = category_data["total_chars"] // category_data["chars_per_token"]
        
        # Calculate totals
        total_tokens = sum(cat["total_tokens"] for cat in categories.values())
        total_files = sum(len(cat["files"]) for cat in categories.values())
        total_chars = sum(cat["total_chars"] for cat in categories.values())
        
        # Print category breakdown
        print("📈 TOKEN BREAKDOWN BY FILE TYPE")
        print("-" * 40)
        for category_name, category_data in categories.items():
            if category_data["files"]:
                percentage = (category_data["total_tokens"] / total_tokens * 100) if total_tokens > 0 else 0
                print(f"{category_name}:")
                print(f"  Files: {len(category_data['files'])}")
                print(f"  Characters: {category_data['total_chars']:,}")
                print(f"  Tokens: {category_data['total_tokens']:,} ({percentage:.1f}%)")
                print()
        
        # Print directory analysis
        print("📁 TOKEN DISTRIBUTION BY DIRECTORY")
        print("-" * 40)
        dir_stats = self.analyze_by_directory(categories)
        for dir_name, stats in sorted(dir_stats.items(), key=lambda x: x[1]["tokens"], reverse=True)[:8]:
            percentage = (stats["tokens"] / total_tokens * 100) if total_tokens > 0 else 0
            print(f"{dir_name}:")
            print(f"  Files: {stats['files']}")
            print(f"  Tokens: {stats['tokens']:,} ({percentage:.1f}%)")
        print()
        
        # Print largest files
        print("🔍 LARGEST SOURCE FILES (Token Impact)")
        print("-" * 40)
        all_files = []
        for category_data in categories.values():
            all_files.extend(category_data["files"])
        
        largest_files = sorted(all_files, key=lambda x: x["tokens"], reverse=True)[:5]
        for i, file_info in enumerate(largest_files, 1):
            print(f"{i}. {file_info['path']}: {file_info['tokens']:,} tokens")
        print()
        
        # Print summary
        print("📊 SUMMARY")
        print("-" * 40)
        print(f"Total Source Files: {total_files}")
        print(f"Total Characters: {total_chars:,}")
        print(f"Total Estimated Tokens: {total_tokens:,}")
        print()
        
        # Claude limit analysis
        claude_limit = 200000
        usage_percent = (total_tokens / claude_limit * 100) if claude_limit > 0 else 0
        remaining = claude_limit - total_tokens
        
        print("🤖 CLAUDE CODE CONTEXT ANALYSIS")
        print("-" * 40)
        print(f"Claude Code Token Limit: {claude_limit:,}")
        print(f"Current Token Usage: {total_tokens:,}")
        print(f"Usage Percentage: {usage_percent:.1f}%")
        
        if total_tokens > claude_limit:
            overage = total_tokens - claude_limit
            print(f"Status: ⚠️  EXCEEDS LIMIT by {overage:,} tokens")
        else:
            print(f"Remaining Capacity: {remaining:,} tokens")
            print(f"Status: ✅ Within Limit ({100 - usage_percent:.1f}% available)")
    
    def analyze_by_directory(self, categories: Dict) -> Dict[str, Dict]:
        """Analyze token distribution by directory."""
        dir_stats = {}
        
        for category_data in categories.values():
            for file_info in category_data["files"]:
                # Get directory path
                dir_path = os.path.dirname(file_info["path"])
                if not dir_path:
                    dir_path = "."
                
                # Initialize directory stats if needed
                if dir_path not in dir_stats:
                    dir_stats[dir_path] = {"files": 0, "tokens": 0}
                
                # Update stats
                dir_stats[dir_path]["files"] += 1
                dir_stats[dir_path]["tokens"] += file_info["tokens"]
        
        return dir_stats


if __name__ == "__main__":
    # Change to parent directory if running from docs folder
    if os.path.basename(os.getcwd()) == "docs":
        os.chdir("..")
    
    counter = TokenCounter()
    counter.run_audit()