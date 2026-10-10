import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function usePatients({ archivedOnly = false } = {}) {
  const container = useContainer();
  const useCases = container.getPatientUseCases();

  return useQuery({
    queryKey: ['patients', { archivedOnly }],
    queryFn: () => useCases.list.execute({ archivedOnly }),
  });
}

export function useCreatePatient() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getPatientUseCases();

  return useMutation({
    mutationFn: (input) => useCases.create.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useCheckPatientCedula() {
  const container = useContainer();
  const useCases = container.getPatientUseCases();

  return useMutation({
    mutationFn: (cedula) => useCases.checkCedula.execute(cedula),
  });
}

export function useFindPatientByCedula() {
  const container = useContainer();
  const useCases = container.getPatientUseCases();

  return useMutation({
    mutationFn: (cedula) => useCases.findByCedula.execute(cedula),
  });
}

export function useUpdatePatient() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getPatientUseCases();

  return useMutation({
    mutationFn: ({ id, input }) => useCases.update.execute(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useArchivePatient() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getPatientUseCases();

  return useMutation({
    mutationFn: (id) => useCases.archive.execute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useRestorePatient() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getPatientUseCases();

  return useMutation({
    mutationFn: (id) => useCases.restore.execute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}