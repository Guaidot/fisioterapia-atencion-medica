import { HomeExercisePlanReviewPort } from '../domain/ports/HomeExercisePlanReviewPort.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';

export class SupabaseHomeExercisePlanReviewAdapter extends HomeExercisePlanReviewPort {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async confirmReview(evaluationId) {
    const { data, error } = await this.client.rpc('confirm_home_exercise_plan_review', {
      p_evaluation_id: evaluationId,
    });
    if (error) throw error;
    return data;
  }
}
