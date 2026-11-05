"""
JARVIS Root Python Entry Point
Can be launched as:
- Interactive CLI: python3 -m python.jarvis
- Server mode: python3 -m python.jarvis --server
"""

import sys
from .cli import main as run_cli
from .server import run_server


def main():
    if "--server" in sys.argv or "-s" in sys.argv:
        port = 5000
        for i, arg in enumerate(sys.argv):
            if arg in ("--port", "-p") and i + 1 < len(sys.argv):
                try:
                    port = int(sys.argv[i + 1])
                except ValueError:
                    pass
        run_server(port)
    else:
        run_cli()


if __name__ == "__main__":
    main()
