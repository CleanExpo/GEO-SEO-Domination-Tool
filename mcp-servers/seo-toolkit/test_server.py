"""
Test script for SEO Toolkit MCP Server

This script helps verify the server setup and API configurations.
"""

import os
import sys
import asyncio
from typing import Dict, List

# Color codes for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{BLUE}{BOLD}{'=' * 60}{RESET}")
    print(f"{BLUE}{BOLD}{text}{RESET}")
    print(f"{BLUE}{BOLD}{'=' * 60}{RESET}\n")


def print_success(text: str):
    """Print success message."""
    print(f"{GREEN}✓ {text}{RESET}")


def print_warning(text: str):
    """Print warning message."""
    print(f"{YELLOW}⚠ {text}{RESET}")


def print_error(text: str):
    """Print error message."""
    print(f"{RED}✗ {text}{RESET}")


def check_python_version():
    """Check if Python version is 3.10 or higher."""
    print_header("Checking Python Version")

    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"

    print(f"Python version: {version_str}")

    if version.major >= 3 and version.minor >= 10:
        print_success("Python version is compatible (3.10+)")
        return True
    else:
        print_error("Python 3.10 or higher is required")
        return False


def check_dependencies():
    """Check if required dependencies are installed."""
    print_header("Checking Dependencies")

    dependencies = {
        "mcp": "MCP SDK",
        "httpx": "HTTP Client",
        "psycopg2": "PostgreSQL Driver (optional)",
    }

    all_installed = True

    for module, name in dependencies.items():
        try:
            __import__(module)
            print_success(f"{name} is installed")
        except ImportError:
            if module == "psycopg2":
                print_warning(f"{name} is not installed (only needed for PostgreSQL)")
            else:
                print_error(f"{name} is not installed")
                all_installed = False

    return all_installed


def check_api_keys():
    """Check if API keys are configured."""
    print_header("Checking API Keys")

    api_keys = {
        "GOOGLE_API_KEY": "Google PageSpeed Insights",
        "SEMRUSH_API_KEY": "SEMrush",
        "ANTHROPIC_API_KEY": "Anthropic Claude",
        "FIRECRAWL_API_KEY": "Firecrawl",
    }

    configured_keys = []
    missing_keys = []

    for key, name in api_keys.items():
        value = os.getenv(key)
        if value and value != "your_" + key.lower():
            print_success(f"{name}: Configured")
            configured_keys.append(key)
        else:
            print_warning(f"{name}: Not configured")
            missing_keys.append(key)

    print(f"\nConfigured: {len(configured_keys)}/{len(api_keys)}")

    if missing_keys:
        print(f"\n{YELLOW}Note: Some features will be unavailable without these API keys:{RESET}")
        for key in missing_keys:
            print(f"  - {api_keys[key]} ({key})")

    return len(configured_keys) > 0


def check_database():
    """Check database configuration."""
    print_header("Checking Database Configuration")

    database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    sqlite_path = os.getenv("SQLITE_PATH", "./data/geo-seo.db")

    if database_url:
        print_success(f"PostgreSQL configured: {database_url[:30]}...")
        return True
    else:
        print(f"Using SQLite: {sqlite_path}")

        # Check if SQLite file exists
        if os.path.exists(sqlite_path):
            print_success(f"SQLite database found at: {sqlite_path}")
            return True
        else:
            print_warning(f"SQLite database not found at: {sqlite_path}")
            print_warning("Run 'npm run db:init' from the project root to create it")
            return False


async def test_api_connection():
    """Test basic API connectivity."""
    print_header("Testing API Connectivity")

    try:
        import httpx

        print("Testing Google PageSpeed Insights API...")
        google_key = os.getenv("GOOGLE_API_KEY")

        if google_key and google_key != "your_google_api_key_here":
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                    params={
                        "url": "https://example.com",
                        "key": google_key,
                        "strategy": "mobile"
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    print_success("Google API is working")
                    return True
                else:
                    print_error(f"Google API returned status {response.status_code}")
                    return False
        else:
            print_warning("Google API key not configured - skipping test")
            return False

    except ImportError:
        print_error("httpx not installed - cannot test API connectivity")
        return False
    except Exception as e:
        print_error(f"API test failed: {str(e)}")
        return False


def check_environment_file():
    """Check if .env file exists and is configured."""
    print_header("Checking Environment File")

    env_file = ".env"
    env_example = ".env.example"

    if os.path.exists(env_file):
        print_success(f"{env_file} exists")

        # Read and check if it's been configured
        with open(env_file, 'r') as f:
            content = f.read()

        if "your_" in content:
            print_warning("Some API keys in .env file are still using placeholder values")
            print_warning("Please update .env with your actual API keys")
        else:
            print_success("Environment file appears to be configured")

        return True
    else:
        print_error(f"{env_file} not found")

        if os.path.exists(env_example):
            print(f"Copy {env_example} to {env_file} and configure your API keys")
        else:
            print_error(f"{env_example} also not found")

        return False


def print_summary(results: Dict[str, bool]):
    """Print test summary."""
    print_header("Test Summary")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"Tests passed: {passed}/{total}\n")

    for test, result in results.items():
        status = f"{GREEN}✓ PASS{RESET}" if result else f"{RED}✗ FAIL{RESET}"
        print(f"{test}: {status}")

    print()

    if passed == total:
        print_success("All tests passed! Server is ready to use.")
        print(f"\n{BLUE}Next steps:{RESET}")
        print("1. Add the server to Claude Desktop configuration")
        print("2. Restart Claude Desktop")
        print("3. Look for 'Search and tools' icon in Claude Desktop")
    elif passed >= total * 0.5:
        print_warning("Some tests failed, but basic functionality should work")
        print(f"\n{YELLOW}Recommendations:{RESET}")
        print("- Configure missing API keys for full functionality")
        print("- Run database initialization if needed")
    else:
        print_error("Multiple tests failed. Please fix the issues above.")
        print(f"\n{RED}Required actions:{RESET}")
        print("- Install missing dependencies")
        print("- Configure environment variables")
        print("- Set up database")


def main():
    """Run all tests."""
    print(f"{BOLD}SEO Toolkit MCP Server - Test Suite{RESET}")

    # Load environment variables from .env if it exists
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print_success("Loaded environment variables from .env")
    except ImportError:
        print_warning("python-dotenv not installed - environment variables must be set manually")

    results = {}

    # Run tests
    results["Python Version"] = check_python_version()
    results["Dependencies"] = check_dependencies()
    results["Environment File"] = check_environment_file()
    results["API Keys"] = check_api_keys()
    results["Database"] = check_database()

    # Run async API test
    if results["Dependencies"]:
        try:
            results["API Connectivity"] = asyncio.run(test_api_connection())
        except Exception as e:
            print_error(f"API connectivity test failed: {e}")
            results["API Connectivity"] = False
    else:
        results["API Connectivity"] = False

    # Print summary
    print_summary(results)


if __name__ == "__main__":
    main()
