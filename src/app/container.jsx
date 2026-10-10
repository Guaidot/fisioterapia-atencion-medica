import { createContext, useContext, useMemo } from 'react';
import { AuthService } from '../shared/application/AuthService.js';
import { SupabaseAuthAdapter } from '../shared/infra/auth/SupabaseAuthAdapter.js';
import { RepositoryFactory } from './factories/RepositoryFactory.js';
import { CreatePatientUseCase } from '../modules/patients/application/usecases/CreatePatient.js';
import { CheckPatientCedulaUseCase } from '../modules/patients/application/usecases/CheckPatientCedula.js';
import { FindPatientByCedulaUseCase } from '../modules/patients/application/usecases/FindPatientByCedula.js';
import { ListPatientsUseCase } from '../modules/patients/application/usecases/ListPatients.js';
import { UpdatePatientUseCase } from '../modules/patients/application/usecases/UpdatePatient.js';
import { ArchivePatientUseCase } from '../modules/patients/application/usecases/ArchivePatient.js';
import { RestorePatientUseCase } from '../modules/patients/application/usecases/RestorePatient.js';
import { CreateClinicalHistoryUseCase } from '../modules/clinicalHistory/application/usecases/CreateClinicalHistory.js';
import { ListClinicalHistoriesUseCase } from '../modules/clinicalHistory/application/usecases/ListClinicalHistories.js';
import { UpdateClinicalHistoryUseCase } from '../modules/clinicalHistory/application/usecases/UpdateClinicalHistory.js';
import { SupabaseUserRepository } from '../modules/users/infrastructure/SupabaseUserRepository.js';
import { SupabaseUserProvisioningAdapter } from '../modules/users/infrastructure/SupabaseUserProvisioningAdapter.js';
import { ListUsersUseCase } from '../modules/users/application/usecases/ListUsersUseCase.js';
import { CreateUserUseCase } from '../modules/users/application/usecases/CreateUserUseCase.js';
import { GetMyProfileUseCase } from '../modules/users/application/usecases/GetMyProfileUseCase.js';
import { UpdateUserRoleUseCase } from '../modules/users/application/usecases/UpdateUserRoleUseCase.js';
import { DeactivateUserUseCase } from '../modules/users/application/usecases/DeactivateUserUseCase.js';
import { BootstrapFirstAdminUseCase } from '../modules/users/application/usecases/BootstrapFirstAdminUseCase.js';
import { SendUserPasswordResetUseCase } from '../modules/users/application/usecases/SendUserPasswordResetUseCase.js';
import { ListAuditEventsUseCase } from '../modules/audit/application/usecases/ListAuditEvents.js';
import {
  CreateInterventionUseCase,
  CreateRomMeasurementUseCase,
  ListInterventionsUseCase,
  ListRomMeasurementsByEvaluationsUseCase,
  ListRomMeasurementsUseCase,
} from '../modules/treatment/application/usecases/TreatmentUseCases.js';
import { GenerateHomeExercisePlanUseCase } from '../modules/reports/application/usecases/GenerateHomeExercisePlan.js';
import { BrowserHomeExercisePlanPdfAdapter } from '../modules/reports/infrastructure/BrowserHomeExercisePlanPdfAdapter.js';

/**
 * Composition Root: única fuente de cableado (Singleton de la aplicación).
 * Crea e inyecta las dependencias de cada módulo, manteniendo bajo acoplamiento.
 */
class AppContainer {
  static #instance = null;

  constructor() {
    if (AppContainer.#instance) {
      return AppContainer.#instance;
    }

    // Infraestructura (adaptadores) creados vía Factory, singleton por repositorio.
    this.#patientRepository = RepositoryFactory.create('patient');
    this.#clinicalHistoryRepository = RepositoryFactory.create('clinicalHistory');
    this.#auditRepository = RepositoryFactory.create('audit');
    this.#treatmentRepository = RepositoryFactory.create('treatment');
    this.homeExercisePlanPdfPort = new BrowserHomeExercisePlanPdfAdapter();
    this.userRepository = new SupabaseUserRepository();
    this.userProvisioningPort = new SupabaseUserProvisioningAdapter();

    this.authService = new AuthService(new SupabaseAuthAdapter());

    // Casos de uso de la capa de aplicación (lazy, singleton).
    this.useCases = {
      patientCreate: null,
      patientCheckCedula: null,
      patientFindByCedula: null,
      patientList: null,
      patientUpdate: null,
      patientArchive: null,
      patientRestore: null,
      historyUpdate: null,
      auditList: null,
      treatmentList: null,
      treatmentCreate: null,
      romList: null,
      romProgressList: null,
      romCreate: null,
      homeExercisePlanGenerate: null,
      userList: null,
      userCreate: null,
      userMyProfile: null,
      userUpdateRole: null,
      userDeactivate: null,
      userBootstrap: null,
      userPasswordReset: null,
    };

    AppContainer.#instance = this;
  }

  #patientRepository;
  #clinicalHistoryRepository;
  #auditRepository;
  #treatmentRepository;

  static getInstance() {
    if (!AppContainer.#instance) {
      AppContainer.#instance = new AppContainer();
    }
    return AppContainer.#instance;
  }

  static reset() {
    AppContainer.#instance = null;
  }

  getPatientUseCases() {
    this.useCases.patientCreate ??= new CreatePatientUseCase(this.#patientRepository);
    this.useCases.patientCheckCedula ??= new CheckPatientCedulaUseCase(
      this.#patientRepository,
    );
    this.useCases.patientFindByCedula ??= new FindPatientByCedulaUseCase(
      this.#patientRepository,
    );
    this.useCases.patientList ??= new ListPatientsUseCase(this.#patientRepository);
    this.useCases.patientUpdate ??= new UpdatePatientUseCase(this.#patientRepository);
    this.useCases.patientArchive ??= new ArchivePatientUseCase(this.#patientRepository);
    this.useCases.patientRestore ??= new RestorePatientUseCase(this.#patientRepository);
    return {
      create: this.useCases.patientCreate,
      checkCedula: this.useCases.patientCheckCedula,
      findByCedula: this.useCases.patientFindByCedula,
      list: this.useCases.patientList,
      update: this.useCases.patientUpdate,
      archive: this.useCases.patientArchive,
      restore: this.useCases.patientRestore,
    };
  }

  getClinicalHistoryUseCases() {
    this.useCases.historyCreate ??= new CreateClinicalHistoryUseCase(
      this.#clinicalHistoryRepository,
    );
    this.useCases.historyList ??= new ListClinicalHistoriesUseCase(
      this.#clinicalHistoryRepository,
    );
    this.useCases.historyUpdate ??= new UpdateClinicalHistoryUseCase(
      this.#clinicalHistoryRepository,
    );
    return {
      create: this.useCases.historyCreate,
      list: this.useCases.historyList,
      update: this.useCases.historyUpdate,
    };
  }

  getAuditUseCases() {
    this.useCases.auditList ??= new ListAuditEventsUseCase(this.#auditRepository);
    return { list: this.useCases.auditList };
  }

  getTreatmentUseCases() {
    this.useCases.treatmentList ??= new ListInterventionsUseCase(this.#treatmentRepository);
    this.useCases.treatmentCreate ??= new CreateInterventionUseCase(this.#treatmentRepository);
    this.useCases.romList ??= new ListRomMeasurementsUseCase(this.#treatmentRepository);
    this.useCases.romProgressList ??= new ListRomMeasurementsByEvaluationsUseCase(
      this.#treatmentRepository,
    );
    this.useCases.romCreate ??= new CreateRomMeasurementUseCase(this.#treatmentRepository);
    return {
      listInterventions: this.useCases.treatmentList,
      createIntervention: this.useCases.treatmentCreate,
      listMeasurements: this.useCases.romList,
      listMeasurementsByEvaluations: this.useCases.romProgressList,
      createMeasurement: this.useCases.romCreate,
    };
  }

  getReportUseCases() {
    this.useCases.homeExercisePlanGenerate ??= new GenerateHomeExercisePlanUseCase(
      this.homeExercisePlanPdfPort,
    );
    return { generateHomeExercisePlan: this.useCases.homeExercisePlanGenerate };
  }

  getUserUseCases() {
    this.useCases.userList ??= new ListUsersUseCase(this.userRepository);
    this.useCases.userCreate ??= new CreateUserUseCase(this.userProvisioningPort);
    this.useCases.userMyProfile ??= new GetMyProfileUseCase(this.userRepository);
    this.useCases.userUpdateRole ??= new UpdateUserRoleUseCase(this.userRepository);
    this.useCases.userDeactivate ??= new DeactivateUserUseCase(this.userRepository);
    this.useCases.userBootstrap ??= new BootstrapFirstAdminUseCase(this.userProvisioningPort);
    this.useCases.userPasswordReset ??= new SendUserPasswordResetUseCase(
      this.userProvisioningPort,
    );
    return {
      list: this.useCases.userList,
      create: this.useCases.userCreate,
      myProfile: this.useCases.userMyProfile,
      updateRole: this.useCases.userUpdateRole,
      deactivate: this.useCases.userDeactivate,
      bootstrap: this.useCases.userBootstrap,
      sendPasswordReset: this.useCases.userPasswordReset,
    };
  }
}

const AppContainerContext = createContext(null);

export function AppContainerProvider({ children }) {
  const container = useMemo(() => AppContainer.getInstance(), []);
  return <AppContainerContext.Provider value={container}>{children}</AppContainerContext.Provider>;
}

export function useContainer() {
  const container = useContext(AppContainerContext);
  if (!container) {
    throw new Error('useContainer debe usarse dentro de <AppContainerProvider>.');
  }
  return container;
}

export { AppContainer };