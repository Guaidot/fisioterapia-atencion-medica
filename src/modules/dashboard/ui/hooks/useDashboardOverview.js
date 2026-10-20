import { useQuery } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useDashboardOverview() {
  const container = useContainer();
  const useCase = container.getDashboardUseCases().overview;

  return useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: () => useCase.execute(),
    staleTime: 60_000,
  });
}
