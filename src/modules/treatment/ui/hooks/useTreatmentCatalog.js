import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useTreatmentCatalog({ activeOnly = true, kind = null } = {}) {
  const useCases = useContainer().getTreatmentCatalogUseCases();
  return useQuery({
    queryKey: ['treatmentCatalog', { activeOnly, kind }],
    queryFn: () => useCases.list.execute({ activeOnly, kind }),
  });
}

export function useSaveTreatmentCatalogItem() {
  const useCases = useContainer().getTreatmentCatalogUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => useCases.save.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treatmentCatalog'] }),
  });
}
