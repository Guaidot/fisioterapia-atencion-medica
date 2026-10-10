import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useClinicalHistories(patientId) {
  const container = useContainer();
  const useCases = container.getClinicalHistoryUseCases();

  return useQuery({
    queryKey: ['clinicalHistories', patientId],
    queryFn: () => useCases.list.execute({ patientId }),
    enabled: Boolean(patientId),
  });
}

export function useCreateClinicalHistory() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getClinicalHistoryUseCases();

  return useMutation({
    mutationFn: (input) => useCases.create.execute(input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['clinicalHistories', variables.patientId] }),
  });
}

export function useUpdateClinicalHistory() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getClinicalHistoryUseCases();

  return useMutation({
    mutationFn: (input) => useCases.update.execute(input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['clinicalHistories', variables.patientId] }),
  });
}