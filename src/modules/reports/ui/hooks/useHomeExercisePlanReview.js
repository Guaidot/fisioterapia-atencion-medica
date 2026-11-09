import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useConfirmHomeExercisePlanReview(patientId) {
  const useCases = useContainer().getReportUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evaluationId) =>
      useCases.confirmHomeExercisePlanReview.execute(evaluationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['clinicalHistories', patientId] }),
  });
}
