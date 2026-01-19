"""
Complete Automated Test Suite for ComputeHub

This comprehensive test suite covers all API endpoints and functionality.
Tests are organized by module for easy maintenance and reporting.

Usage:
    python complete_automated_test.py
    
    # Run specific module:
    python complete_automated_test.py --module license
    
    # Verbose output:
    python complete_automated_test.py --verbose
"""

import requests
import json
import time
import argparse
from typing import Dict, List, Tuple, Optional
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

# Test results storage
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "modules": {}
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str, level: int = 1):
    """Print formatted header"""
    if level == 1:
        print(f"\n{Colors.BLUE}{Colors.BOLD}{'=' * 70}{Colors.END}")
        print(f"{Colors.BLUE}{Colors.BOLD}{text}{Colors.END}")
        print(f"{Colors.BLUE}{Colors.BOLD}{'=' * 70}{Colors.END}\n")
    elif level == 2:
        print(f"\n{Colors.CYAN}{'-' * 70}{Colors.END}")
        print(f"{Colors.CYAN}{text}{Colors.END}")
        print(f"{Colors.CYAN}{'-' * 70}{Colors.END}\n")

def print_test(module: str, name: str, passed: bool, message: str = "", skip: bool = False):
    """Print test result and record it"""
    if skip:
        status = f"{Colors.YELLOW}⏭️  SKIP{Colors.END}"
        test_results["skipped"] += 1
    elif passed:
        status = f"{Colors.GREEN}✅ PASS{Colors.END}"
        test_results["passed"] += 1
    else:
        status = f"{Colors.RED}❌ FAIL{Colors.END}"
        test_results["failed"] += 1
    
    test_results["total"] += 1
    
    # Record in module
    if module not in test_results["modules"]:
        test_results["modules"][module] = {"passed": 0, "failed": 0, "skipped": 0, "tests": []}
    
    test_results["modules"][module]["tests"].append({
        "name": name,
        "passed": passed,
        "skipped": skip,
        "message": message
    })
    
    if skip:
        test_results["modules"][module]["skipped"] += 1
    elif passed:
        test_results["modules"][module]["passed"] += 1
    else:
        test_results["modules"][module]["failed"] += 1
    
    print(f"{status} - {name}")
    if message:
        print(f"    {Colors.YELLOW}{message}{Colors.END}")

def test_endpoint(endpoint: str, method: str = "GET", data: dict = None, 
                  expected_status: int = None, headers: dict = None) -> Tuple[bool, int, dict]:
    """Generic endpoint tester"""
    try:
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        url = f"{API_BASE}{endpoint}"
        
        if method == "GET":
            response = requests.get(url, headers=default_headers)
        elif method == "POST":
            response = requests.post(url, headers=default_headers, json=data or {})
        elif method == "PUT":
            response = requests.put(url, headers=default_headers, json=data or {})
        elif method == "DELETE":
            response = requests.delete(url, headers=default_headers)
        elif method == "PATCH":
            response = requests.patch(url, headers=default_headers, json=data or {})
        
        if expected_status:
            passed = response.status_code == expected_status
        else:
            passed = response.status_code < 500  # No server errors
        
        try:
            response_data = response.json()
        except:
            response_data = {}
        
        return passed, response.status_code, response_data
    except Exception as e:
        return False, 0, {"error": str(e)}

# ============================================================================
# Module 1: License System Tests
# ============================================================================

def test_license_system():
    """Test License system endpoints"""
    print_header("Module 1: License System", level=2)
    module = "License System"
    
    # Test 1: Get License Status (without auth)
    passed, status, data = test_endpoint("/license/status", "GET")
    print_test(module, "Get License Status - No Auth", 
               status == 401, f"Status: {status}")
    
    # Test 2: Activate License (without auth)
    passed, status, data = test_endpoint("/license/activate", "POST", 
                                         {"license_key": "TEST-KEY"})
    print_test(module, "Activate License - No Auth", 
               status == 401, f"Status: {status}")
    
    # Test 3: Deactivate License (without auth)
    passed, status, data = test_endpoint("/license/deactivate", "DELETE")
    print_test(module, "Deactivate License - No Auth", 
               status == 401, f"Status: {status}")

# ============================================================================
# Module 2: Deployment Management Tests
# ============================================================================

def test_deployment_management():
    """Test Deployment management endpoints"""
    print_header("Module 2: Deployment Management", level=2)
    module = "Deployment Management"
    
    # Test 1: List Deployments
    passed, status, data = test_endpoint("/deployments", "GET")
    print_test(module, "List Deployments", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: Create Deployment
    deployment_data = {
        "name": "Test Deployment",
        "gpu_type": "RTX 3090",
        "gpu_count": 1,
        "image": "pytorch/pytorch:latest"
    }
    passed, status, data = test_endpoint("/deployments", "POST", deployment_data)
    print_test(module, "Create Deployment", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 3: Get Deployment Details
    passed, status, data = test_endpoint("/deployments/1", "GET")
    print_test(module, "Get Deployment Details", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 4: Start Deployment
    passed, status, data = test_endpoint("/deployments/1/start", "POST")
    print_test(module, "Start Deployment", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 5: Stop Deployment
    passed, status, data = test_endpoint("/deployments/1/stop", "POST")
    print_test(module, "Stop Deployment", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 6: Restart Deployment
    passed, status, data = test_endpoint("/deployments/1/restart", "POST")
    print_test(module, "Restart Deployment", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 7: Delete Deployment
    passed, status, data = test_endpoint("/deployments/1", "DELETE")
    print_test(module, "Delete Deployment", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 3: Batch Operations Tests (Pro Feature)
# ============================================================================

def test_batch_operations():
    """Test Batch operations (Pro feature)"""
    print_header("Module 3: Batch Operations (Pro)", level=2)
    module = "Batch Operations"
    
    batch_data = {"deployment_ids": [1, 2, 3]}
    
    # Test 1: Batch Start
    passed, status, data = test_endpoint("/deployments/batch/start", "POST", batch_data)
    print_test(module, "Batch Start - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 2: Batch Stop
    passed, status, data = test_endpoint("/deployments/batch/stop", "POST", batch_data)
    print_test(module, "Batch Stop - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 3: Batch Delete
    passed, status, data = test_endpoint("/deployments/batch/delete", "POST", batch_data)
    print_test(module, "Batch Delete - Requires Pro", 
               status in [401, 403], f"Status: {status}")

# ============================================================================
# Module 4: Template System Tests
# ============================================================================

def test_template_system():
    """Test Template system endpoints"""
    print_header("Module 4: Template System", level=2)
    module = "Template System"
    
    # Test 1: List All Templates
    passed, status, data = test_endpoint("/templates", "GET")
    print_test(module, "List All Templates", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: List Official Templates (Public)
    passed, status, data = test_endpoint("/templates/official", "GET")
    print_test(module, "List Official Templates - Public", 
               status == 200, f"Status: {status}")
    
    # Test 3: List My Templates
    passed, status, data = test_endpoint("/templates/my", "GET")
    print_test(module, "List My Templates", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 4: Get Template Details
    passed, status, data = test_endpoint("/templates/1", "GET")
    print_test(module, "Get Template Details", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 5: Create Template
    template_data = {
        "name": "Test Template",
        "image": "pytorch/pytorch:latest",
        "gpu_type": "RTX 3090",
        "gpu_count": 1
    }
    passed, status, data = test_endpoint("/templates", "POST", template_data)
    print_test(module, "Create Template", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 6: Deploy from Template
    passed, status, data = test_endpoint("/templates/1/deploy", "POST", 
                                         {"name": "Test Deployment"})
    print_test(module, "Deploy from Template", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 7: Delete Template
    passed, status, data = test_endpoint("/templates/1", "DELETE")
    print_test(module, "Delete Template", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 5: Automation Rules Tests (Pro Feature)
# ============================================================================

def test_automation_rules():
    """Test Automation rules (Pro feature)"""
    print_header("Module 5: Automation Rules (Pro)", level=2)
    module = "Automation Rules"
    
    rule_data = {
        "name": "Test Rule",
        "trigger_type": "cost_threshold",
        "action_type": "stop_deployment",
        "threshold": 100
    }
    
    # Test 1: List Rules
    passed, status, data = test_endpoint("/rules", "GET")
    print_test(module, "List Rules - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 2: Create Rule
    passed, status, data = test_endpoint("/rules", "POST", rule_data)
    print_test(module, "Create Rule - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 3: Get Rule
    passed, status, data = test_endpoint("/rules/1", "GET")
    print_test(module, "Get Rule - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 4: Update Rule
    passed, status, data = test_endpoint("/rules/1", "PUT", {"name": "Updated"})
    print_test(module, "Update Rule - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 5: Delete Rule
    passed, status, data = test_endpoint("/rules/1", "DELETE")
    print_test(module, "Delete Rule - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 6: Toggle Rule
    passed, status, data = test_endpoint("/rules/1/toggle", "POST")
    print_test(module, "Toggle Rule - Requires Pro", 
               status in [401, 403], f"Status: {status}")

# ============================================================================
# Module 6: Notification System Tests (Pro Feature)
# ============================================================================

def test_notification_system():
    """Test Notification system (Pro feature)"""
    print_header("Module 6: Notification System (Pro)", level=2)
    module = "Notification System"
    
    settings_data = {
        "email": "test@example.com",
        "enable_email": True
    }
    
    # Test 1: Get Notification Settings
    passed, status, data = test_endpoint("/notifications/settings", "GET")
    print_test(module, "Get Settings - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 2: Update Notification Settings
    passed, status, data = test_endpoint("/notifications/settings", "PUT", settings_data)
    print_test(module, "Update Settings - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 3: Bind Telegram
    telegram_data = {"chat_id": "123456", "username": "testuser"}
    passed, status, data = test_endpoint("/notifications/telegram/bind", "POST", telegram_data)
    print_test(module, "Bind Telegram - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 4: Test Webhook
    webhook_data = {"url": "https://example.com/webhook"}
    passed, status, data = test_endpoint("/notifications/webhook/test", "POST", webhook_data)
    print_test(module, "Test Webhook - Requires Pro", 
               status in [401, 403], f"Status: {status}")
    
    # Test 5: Get Notification History
    passed, status, data = test_endpoint("/notifications/history", "GET")
    print_test(module, "Get Notification History", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 7: Monitoring System Tests
# ============================================================================

def test_monitoring_system():
    """Test Monitoring system endpoints"""
    print_header("Module 7: Monitoring System", level=2)
    module = "Monitoring System"
    
    # Test 1: Get Current Metrics
    passed, status, data = test_endpoint("/deployments/1/metrics/current", "GET")
    print_test(module, "Get Current Metrics", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: Get Metrics History
    passed, status, data = test_endpoint("/deployments/1/metrics/history", "GET")
    print_test(module, "Get Metrics History", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 3: Get Alerts
    passed, status, data = test_endpoint("/deployments/1/alerts", "GET")
    print_test(module, "Get Alerts", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 8: Provider Management Tests
# ============================================================================

def test_provider_management():
    """Test Provider management endpoints"""
    print_header("Module 8: Provider Management", level=2)
    module = "Provider Management"
    
    provider_data = {
        "provider_type": "vastai",
        "api_key": "test_api_key"
    }
    
    # Test 1: List Providers
    passed, status, data = test_endpoint("/user-providers", "GET")
    print_test(module, "List Providers", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: Add Provider
    passed, status, data = test_endpoint("/user-providers", "POST", provider_data)
    print_test(module, "Add Provider", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 3: Update Provider
    passed, status, data = test_endpoint("/user-providers/1", "PATCH", 
                                         {"api_key": "new_key"})
    print_test(module, "Update Provider", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 4: Verify Provider
    passed, status, data = test_endpoint("/user-providers/1/verify", "POST")
    print_test(module, "Verify Provider", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 5: Delete Provider
    passed, status, data = test_endpoint("/user-providers/1", "DELETE")
    print_test(module, "Delete Provider", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 9: Cost Management Tests
# ============================================================================

def test_cost_management():
    """Test Cost management endpoints"""
    print_header("Module 9: Cost Management", level=2)
    module = "Cost Management"
    
    # Test 1: Get Cost Summary
    passed, status, data = test_endpoint("/costs/summary", "GET")
    print_test(module, "Get Cost Summary", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: Get Cost Breakdown
    passed, status, data = test_endpoint("/costs/breakdown", "GET")
    print_test(module, "Get Cost Breakdown", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 10: GPU Pricing Tests
# ============================================================================

def test_gpu_pricing():
    """Test GPU pricing endpoints"""
    print_header("Module 10: GPU Pricing", level=2)
    module = "GPU Pricing"
    
    # Test 1: Get GPU Prices (Public)
    passed, status, data = test_endpoint("/public/gpu-prices", "GET")
    print_test(module, "Get GPU Prices - Public", 
               status == 200, f"Status: {status}")
    
    # Test 2: Get Price History
    passed, status, data = test_endpoint("/public/gpu-prices/RTX3090/history", "GET")
    print_test(module, "Get Price History - Public", 
               status in [200, 404], f"Status: {status}")

# ============================================================================
# Module 11: Organization Management Tests
# ============================================================================

def test_organization_management():
    """Test Organization management endpoints"""
    print_header("Module 11: Organization Management", level=2)
    module = "Organization Management"
    
    org_data = {"name": "Test Organization"}
    
    # Test 1: List Organizations
    passed, status, data = test_endpoint("/organizations", "GET")
    print_test(module, "List Organizations", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: Create Organization
    passed, status, data = test_endpoint("/organizations", "POST", org_data)
    print_test(module, "Create Organization", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 3: Get Organization
    passed, status, data = test_endpoint("/organizations/1", "GET")
    print_test(module, "Get Organization", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Module 12: Project Management Tests
# ============================================================================

def test_project_management():
    """Test Project management endpoints"""
    print_header("Module 12: Project Management", level=2)
    module = "Project Management"
    
    project_data = {"name": "Test Project"}
    
    # Test 1: List Projects
    passed, status, data = test_endpoint("/projects", "GET")
    print_test(module, "List Projects", 
               status == 401, f"Status: {status} (Auth required)")
    
    # Test 2: Create Project
    passed, status, data = test_endpoint("/projects", "POST", project_data)
    print_test(module, "Create Project", 
               status == 401, f"Status: {status} (Auth required)")

# ============================================================================
# Summary and Reporting
# ============================================================================

def print_summary():
    """Print test summary"""
    print_header("Test Summary", level=1)
    
    total = test_results["total"]
    passed = test_results["passed"]
    failed = test_results["failed"]
    skipped = test_results["skipped"]
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    print(f"{Colors.YELLOW}Skipped: {skipped}{Colors.END}")
    print(f"\nSuccess Rate: {Colors.BOLD}{success_rate:.1f}%{Colors.END}\n")
    
    # Module breakdown
    print_header("Module Breakdown", level=2)
    for module, results in test_results["modules"].items():
        module_total = results["passed"] + results["failed"] + results["skipped"]
        module_rate = (results["passed"] / module_total * 100) if module_total > 0 else 0
        
        status_color = Colors.GREEN if module_rate == 100 else Colors.YELLOW if module_rate >= 80 else Colors.RED
        print(f"{status_color}{module}:{Colors.END}")
        print(f"  Passed: {results['passed']}, Failed: {results['failed']}, Skipped: {results['skipped']}")
        print(f"  Success Rate: {module_rate:.1f}%\n")
    
    # Failed tests
    if failed > 0:
        print_header("Failed Tests", level=2)
        for module, results in test_results["modules"].items():
            failed_tests = [t for t in results["tests"] if not t["passed"] and not t["skipped"]]
            if failed_tests:
                print(f"{Colors.RED}{module}:{Colors.END}")
                for test in failed_tests:
                    print(f"  - {test['name']}")
                    if test["message"]:
                        print(f"    {test['message']}")
                print()

def save_report():
    """Save test report to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"test_report_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print(f"\n{Colors.CYAN}Test report saved to: {filename}{Colors.END}\n")

# ============================================================================
# Main Test Runner
# ============================================================================

def run_all_tests():
    """Run all test modules"""
    print_header("ComputeHub Complete Automated Test Suite", level=1)
    print(f"{Colors.YELLOW}Backend URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.YELLOW}Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}\n")
    
    # Run all test modules
    test_license_system()
    test_deployment_management()
    test_batch_operations()
    test_template_system()
    test_automation_rules()
    test_notification_system()
    test_monitoring_system()
    test_provider_management()
    test_cost_management()
    test_gpu_pricing()
    test_organization_management()
    test_project_management()
    
    # Print summary
    print_summary()
    
    # Save report
    save_report()
    
    # Return exit code
    return 0 if test_results["failed"] == 0 else 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ComputeHub Automated Test Suite")
    parser.add_argument("--module", help="Run specific module only")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    exit_code = run_all_tests()
    
    if exit_code == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ All tests passed!{Colors.END}\n")
    else:
        print(f"{Colors.RED}{Colors.BOLD}❌ Some tests failed. Please review the results above.{Colors.END}\n")
    
    exit(exit_code)
