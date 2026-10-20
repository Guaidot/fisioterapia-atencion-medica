import { useQuery } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useAuditEvents({ page = 1, pageSize = 10 } = {}) {
  const container = useContainer();
  const useCases = container.getAuditUseCases();

  return useQuery({
    queryKey: ['auditEvents', { page, pageSize }],
    queryFn: () => useCases.list.execute({ page, pageSize }),
    staleTime: 30_000,
  });
}
