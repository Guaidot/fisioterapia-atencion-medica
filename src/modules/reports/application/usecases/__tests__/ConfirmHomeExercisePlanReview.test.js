import { describe, expect, it, vi } from 'vitest';
import { HomeExercisePlanReviewPort } from '../../../domain/ports/HomeExercisePlanReviewPort.js';
import { ConfirmHomeExercisePlanReviewUseCase } from '../ConfirmHomeExercisePlanReview.js';

class ReviewPortStub extends HomeExercisePlanReviewPort {
  confirmReview = vi.fn(async () => ({
    home_exercise_plan_reviewed_at: '2026-10-20T12:00:00.000Z',
    home_exercise_plan_reviewed_by: 'therapist-1',
  }));
}

describe('ConfirmHomeExercisePlanReviewUseCase', () => {
  it('returns persisted review metadata', async () => {
    const port = new ReviewPortStub();
    const useCase = new ConfirmHomeExercisePlanReviewUseCase(port);

    await expect(useCase.execute('evaluation-1')).resolves.toEqual({
      reviewedAt: '2026-10-20T12:00:00.000Z',
      reviewedBy: 'therapist-1',
    });
    expect(port.confirmReview).toHaveBeenCalledWith('evaluation-1');
  });

  it('rejects a missing evaluation ID', async () => {
    const useCase = new ConfirmHomeExercisePlanReviewUseCase(new ReviewPortStub());
    await expect(useCase.execute('')).rejects.toThrow('no es válida');
  });
});
