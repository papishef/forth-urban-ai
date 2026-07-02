/**
 * Quiz module — Phase 2 (see docs/IMPLEMENTATION_PLAN.md#phase-2--core-funnel-profile-quiz-decision-engine).
 *
 * Owns: `quizResponses` model, Home-Readiness Quiz + Best Abuja Area Quiz
 * submission endpoints. Delegates all scoring to modules/decision-engine —
 * never computes scores itself.
 */
export { quizRouter } from "./quiz.routes.js";
export { QuizResponse, type QuizResponseDocument } from "./quiz-response.model.js";

