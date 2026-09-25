import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.tests.test_validator import (
    test_validator_passes_well_formed_schema,
    test_validator_fails_incomplete_state,
    test_validator_catches_overlapping_options,
    test_validator_catches_type_mismatch
)
from app.tests.test_patcher import (
    test_patcher_resolves_type_mismatch,
    test_patcher_stall_detection
)
from app.tests.test_pipeline import (
    test_root_endpoint,
    test_cache_hit_restricted_mode,
    test_cache_hit_unrestricted_mode_auto_executes,
    test_cold_miss_evaluation,
    test_instant_chip_revalidate,
    test_execute_jev_decision
)

tests = [
    ("test_validator_passes_well_formed_schema", test_validator_passes_well_formed_schema),
    ("test_validator_fails_incomplete_state", test_validator_fails_incomplete_state),
    ("test_validator_catches_overlapping_options", test_validator_catches_overlapping_options),
    ("test_validator_catches_type_mismatch", test_validator_catches_type_mismatch),
    ("test_patcher_resolves_type_mismatch", test_patcher_resolves_type_mismatch),
    ("test_patcher_stall_detection", test_patcher_stall_detection),
    ("test_root_endpoint", test_root_endpoint),
    ("test_cache_hit_restricted_mode", test_cache_hit_restricted_mode),
    ("test_cache_hit_unrestricted_mode_auto_executes", test_cache_hit_unrestricted_mode_auto_executes),
    ("test_cold_miss_evaluation", test_cold_miss_evaluation),
    ("test_instant_chip_revalidate", test_instant_chip_revalidate),
    ("test_execute_jev_decision", test_execute_jev_decision),
]

passed = 0
failed = 0

print("=" * 60)
print("RUNNING BACKEND TEST SUITE")
print("=" * 60)

for name, fn in tests:
    try:
        fn()
        print(f"  [PASS] {name}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        failed += 1

print("=" * 60)
print(f"TOTAL: {len(tests)} | PASSED: {passed} | FAILED: {failed}")
print("=" * 60)

if failed > 0:
    sys.exit(1)
