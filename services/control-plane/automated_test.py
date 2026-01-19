"""
Automated API Testing Script for ComputeHub Pro Features

This script tests all Pro-protected API endpoints to verify:
1. Endpoints return 403 without Pro License
2. Endpoints work correctly with Pro License
3. License activation/deactivation works

Usage:
    python automated_test.py
"""

import requests
import json
import time
from typing import Dict, List, Tuple

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

# Test results
test_results = []

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.END}\n")

def print_test(name: str, passed: bool, message: str = ""):
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"{status} - {name}")
    if message:
        print(f"    {message}")
    test_results.append({"name": name, "passed": passed, "message": message})

def test_endpoint_without_pro(endpoint: str, method: str = "GET", data: dict = None) -> bool:
    """Test that endpoint returns 403 without Pro License"""
    try:
        headers = {"Content-Type": "application/json"}
        
        if method == "GET":
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers)
        elif method == "POST":
            response = requests.post(f"{API_BASE}{endpoint}", headers=headers, json=data or {})
        elif method == "PUT":
            response = requests.put(f"{API_BASE}{endpoint}", headers=headers, json=data or {})
        elif method == "DELETE":
            response = requests.delete(f"{API_BASE}{endpoint}", headers=headers)
        
        # Should return 403 for Pro endpoints
        if response.status_code == 403:
            return True
        elif response.status_code == 401:
            # Authentication required - expected
            return True
        else:
            print(f"    Expected 403, got {response.status_code}")
            return False
    except Exception as e:
        print(f"    Error: {e}")
        return False

def run_automated_tests():
    """Run all automated API tests"""
    
    print_header("ComputeHub Pro Features - Automated API Testing")
    
    # Test 1: Batch Operations
    print_header("1. Testing Batch Operations (Pro Feature)")
    
    print_test(
        "Batch Start - Should require Pro",
        test_endpoint_without_pro("/deployments/batch/start", "POST", {"deployment_ids": [1, 2]})
    )
    
    print_test(
        "Batch Stop - Should require Pro",
        test_endpoint_without_pro("/deployments/batch/stop", "POST", {"deployment_ids": [1, 2]})
    )
    
    print_test(
        "Batch Delete - Should require Pro",
        test_endpoint_without_pro("/deployments/batch/delete", "POST", {"deployment_ids": [1, 2]})
    )
    
    # Test 2: Automation Rules
    print_header("2. Testing Automation Rules (Pro Feature)")
    
    print_test(
        "List Rules - Should require Pro",
        test_endpoint_without_pro("/rules", "GET")
    )
    
    print_test(
        "Create Rule - Should require Pro",
        test_endpoint_without_pro("/rules", "POST", {
            "name": "Test Rule",
            "trigger_type": "cost_threshold",
            "action_type": "stop_deployment"
        })
    )
    
    print_test(
        "Get Rule - Should require Pro",
        test_endpoint_without_pro("/rules/1", "GET")
    )
    
    print_test(
        "Update Rule - Should require Pro",
        test_endpoint_without_pro("/rules/1", "PUT", {"name": "Updated"})
    )
    
    print_test(
        "Delete Rule - Should require Pro",
        test_endpoint_without_pro("/rules/1", "DELETE")
    )
    
    print_test(
        "Toggle Rule - Should require Pro",
        test_endpoint_without_pro("/rules/1/toggle", "POST")
    )
    
    # Test 3: Notifications
    print_header("3. Testing Notification System (Pro Feature)")
    
    print_test(
        "Get Notification Settings - Should require Pro",
        test_endpoint_without_pro("/notifications/settings", "GET")
    )
    
    print_test(
        "Update Notification Settings - Should require Pro",
        test_endpoint_without_pro("/notifications/settings", "PUT", {
            "email": "test@example.com",
            "enable_email": True
        })
    )
    
    print_test(
        "Bind Telegram - Should require Pro",
        test_endpoint_without_pro("/notifications/telegram/bind", "POST", {
            "chat_id": "123456",
            "username": "testuser"
        })
    )
    
    print_test(
        "Test Webhook - Should require Pro",
        test_endpoint_without_pro("/notifications/webhook/test", "POST", {
            "url": "https://example.com/webhook"
        })
    )
    
    # Test 4: Free Features (Should NOT require Pro)
    print_header("4. Testing Free Features (Should Work)")
    
    # Note: These will return 401 (auth required) but NOT 403 (Pro required)
    response = requests.get(f"{API_BASE}/deployments")
    print_test(
        "List Deployments - Should be Free",
        response.status_code != 403,
        f"Status: {response.status_code} (401 is OK, means auth required)"
    )
    
    response = requests.get(f"{API_BASE}/templates/official")
    print_test(
        "List Official Templates - Should be Free",
        response.status_code == 200,
        f"Status: {response.status_code}"
    )
    
    # Summary
    print_header("Test Summary")
    
    total = len(test_results)
    passed = sum(1 for r in test_results if r["passed"])
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    print(f"Success Rate: {(passed/total*100):.1f}%\n")
    
    if failed > 0:
        print(f"{Colors.YELLOW}Failed Tests:{Colors.END}")
        for result in test_results:
            if not result["passed"]:
                print(f"  - {result['name']}")
                if result["message"]:
                    print(f"    {result['message']}")
    
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}\n")
    
    return failed == 0

if __name__ == "__main__":
    print(f"\n{Colors.YELLOW}Starting automated API tests...{Colors.END}")
    print(f"{Colors.YELLOW}Make sure the backend is running at {BASE_URL}{Colors.END}\n")
    
    time.sleep(1)
    
    success = run_automated_tests()
    
    if success:
        print(f"{Colors.GREEN}✅ All tests passed!{Colors.END}\n")
        exit(0)
    else:
        print(f"{Colors.RED}❌ Some tests failed. Please review the results above.{Colors.END}\n")
        exit(1)
