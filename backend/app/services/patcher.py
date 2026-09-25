from typing import Any, Dict, List, Optional, Tuple
import copy
from app.models.jev_types import CandidateSchema, FitnessReport, QuestionType

class PatcherService:
    """
    Implements Section 5 of Architecture.md:
    Targeted diff patching rather than blind re-rolls.
    Routes failure types to specific repair strategies and tracks retry deltas to detect stall loops.
    """

    def patch_schema(
        self,
        schema_data: CandidateSchema,
        report: FitnessReport,
        user_prompt: str
    ) -> CandidateSchema:
        """
        Applies surgical patches based on the diagnostics in the fitness report.
        """
        patched = copy.deepcopy(schema_data)

        # 1. Handle question type mismatch (should_be_score / should_be_noul / should_be_choice)
        type_flag = report.type_fitness.get("judgment")
        if type_flag == "should_be_score":
            patched.type = QuestionType.SCORE
            patched.min_score = 1.0
            patched.max_score = 5.0
            patched.criteria = "Level of urgency or operational priority"
            patched.options = []
            return patched

        if type_flag == "should_be_noul":
            patched.type = QuestionType.NOUL
            patched.assertion = f"Verify: {user_prompt.strip()}"
            patched.options = []
            return patched

        if type_flag == "should_be_choice":
            patched.type = QuestionType.CHOICE
            patched.options = ["Option A", "Option B", "Other"]
            return patched

        # 2. Handle missing_option (Coverage check)
        coverage_flag = report.coverage.get("judgment")
        if coverage_flag == "missing_option":
            current_opts = patched.options or []
            if "General Inquiries" not in current_opts and "Other" not in current_opts:
                current_opts.append("General Inquiries")
            patched.options = current_opts

        # 3. Handle mutual exclusivity (Overlapping / duplicate options)
        if not report.exclusivity.get("is_exclusive", True):
            unique_opts = []
            seen = set()
            for opt in (patched.options or []):
                cleaned = opt.strip().lower()
                if cleaned not in seen:
                    seen.add(cleaned)
                    unique_opts.append(opt.strip())
            patched.options = unique_opts

        # 4. Handle scope sizing (too_narrow or too_broad)
        scope_flag = report.scope.get("judgment")
        if scope_flag == "too_narrow":
            current_opts = patched.options or []
            if len(current_opts) == 1:
                current_opts.append("Other / Not Applicable")
            patched.options = current_opts
        elif scope_flag == "too_broad":
            # Consolidate down to top 6 options + Other
            current_opts = patched.options or []
            if len(current_opts) > 6:
                patched.options = current_opts[:5] + ["Other / Uncategorized"]

        return patched

    def has_stalled(self, prev_report: Optional[FitnessReport], curr_report: FitnessReport) -> bool:
        """
        Detects if the retry loop has stalled by checking if consecutive attempts reproduce identical error diagnostics.
        """
        if not prev_report:
            return False
        
        prev_diag = sorted(prev_report.diagnostics)
        curr_diag = sorted(curr_report.diagnostics)
        return len(prev_diag) > 0 and prev_diag == curr_diag

patcher_service = PatcherService()
