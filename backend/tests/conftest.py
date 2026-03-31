"""
conftest.py — pytest configuration for the Protly backend test suite.

Adds the backend directory (parent of this file) to sys.path so that
`import main` works regardless of which directory pytest is invoked from.
"""

import sys
import os

# Ensure the backend package root is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
