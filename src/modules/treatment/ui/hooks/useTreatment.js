import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useEvaluationTreatment(clinicalEvaluationId) {
  const container = useContainer();
  const useCases = container.getTreatmentUseCases();
  const queryClient = useQueryClient();
  const key = ['evaluationTreatment', clinicalEvaluationId];
  const interventions = useQuery({
    queryKey: [...key, 'interventions'],
    queryFn: () => useCases.listInterventions.execute({ clinicalEvaluationId }),
    enabled: Boolean(clinicalEvaluationId),
  });
  const measurements = useQuery({
    queryKey: [...key, 'measurements'],
    queryFn: () => useCases.listMeasurements.execute({ clinicalEvaluationId }),
    enabled: Boolean(clinicalEvaluationId),
  });
  const createIntervention = useMutation({
    mutationFn: (input) => useCases.createIntervention.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...key, 'interventions'] }),
  });
  const createMeasurement = useMutation({
    mutationFn: (input) => useCases.createMeasurement.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...key, 'measurements'] }),
  });

  return { interventions, measurements, createIntervention, createMeasurement };
}

export function usePatientRomProgress(clinicalEvaluationIds) {
  const container = useContainer();
  const useCases = container.getTreatmentUseCases();
  const ids = [...new Set(clinicalEvaluationIds)].sort();

  return useQuery({
    queryKey: ['patientRomProgress', ids],
    queryFn: () => useCases.listMeasurementsByEvaluations.execute({ clinicalEvaluationIds: ids }),
    enabled: ids.length > 0,
  });
}
