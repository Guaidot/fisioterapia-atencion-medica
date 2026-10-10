import { useQuery } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useAuditEvents(limit = 100) {
  const container = useContainer();
  const useCases = container.getAuditUseCases();

  return useQuery({
    queryKey: ['auditEvents', limit],
    queryFn: () => useCases.list.execute({ limit }),
    staleTime: 30_000,
  });
}
