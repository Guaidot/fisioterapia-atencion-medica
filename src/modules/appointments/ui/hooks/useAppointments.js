import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useAppointments(enabled = true) {
  const useCases = useContainer().getAppointmentUseCases();
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => useCases.list.execute(),
    enabled,
  });
}

export function useAppointmentActions() {
  const useCases = useContainer().getAppointmentUseCases();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const create = useMutation({
    mutationFn: (input) => useCases.create.execute(input),
    onSuccess: refresh,
  });
  const updateStatus = useMutation({
    mutationFn: (input) => useCases.updateStatus.execute(input),
    onSuccess: refresh,
  });
  const reschedule = useMutation({
    mutationFn: (input) => useCases.reschedule.execute(input),
    onSuccess: refresh,
  });

  return { create, updateStatus, reschedule };
}
