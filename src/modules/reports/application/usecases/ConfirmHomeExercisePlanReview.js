import { DomainError } from '../../../../shared/domain/DomainError.js';
import { HomeExercisePlanReviewPort } from '../../domain/ports/HomeExercisePlanReviewPort.js';

export class ConfirmHomeExercisePlanReviewUseCase {
  #reviewPort;

  constructor(reviewPort) {
    if (!(reviewPort instanceof HomeExercisePlanReviewPort)) {
      throw new TypeError(
        'ConfirmHomeExercisePlanReviewUseCase requiere un HomeExercisePlanReviewPort.',
      );
    }
    this.#reviewPort = reviewPort;
  }

  async execute(evaluationId) {
    if (!evaluationId) throw new DomainError('La evaluación que intentas confirmar no es válida.');
    const row = await this.#reviewPort.confirmReview(evaluationId);
    return {
      reviewedAt: row.home_exercise_plan_reviewed_at,
      reviewedBy: row.home_exercise_plan_reviewed_by,
    };
  }
}
