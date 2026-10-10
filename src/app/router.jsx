import { createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary.jsx';
import { Layout } from '../shared/ui/Layout.jsx';
import { RequireAuth } from '../shared/ui/RequireAuth.jsx';
import { RequireRole } from '../shared/ui/RequireRole.jsx';
import { LoginPage } from '../shared/ui/pages/LoginPage.jsx';
import { RegisterPage } from '../modules/users/ui/pages/RegisterPage.jsx';
import { PatientsListPage } from '../modules/patients/ui/pages/PatientsListPage.jsx';
import { PatientFormPage } from '../modules/patients/ui/pages/PatientFormPage.jsx';
import { PatientDetailPage } from '../modules/clinicalHistory/ui/pages/PatientDetailPage.jsx';
import { UsersAdminPage } from '../modules/users/ui/pages/UsersAdminPage.jsx';
import { BootstrapAdminPage } from '../modules/users/ui/pages/BootstrapAdminPage.jsx';
import { AuditLogPage } from '../modules/audit/ui/pages/AuditLogPage.jsx';
import { ResetPasswordPage } from '../shared/ui/pages/ResetPasswordPage.jsx';
import { ROLES } from '../modules/users/domain/entities/Role.js';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorBoundary /> },
  { path: '/register', element: <RegisterPage />, errorElement: <ErrorBoundary /> },
  { path: '/setup', element: <BootstrapAdminPage />, errorElement: <ErrorBoundary /> },
  { path: '/restablecer-contrasena', element: <ResetPasswordPage />, errorElement: <ErrorBoundary /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <PatientsListPage /> },
      { path: 'pacientes', element: <PatientsListPage /> },
      { path: 'pacientes/nuevo', element: <PatientFormPage /> },
      { path: 'pacientes/:id', element: <PatientDetailPage /> },
      {
        path: 'usuarios',
        element: (
          <RequireRole roles={[ROLES.ADMIN]}>
            <UsersAdminPage />
          </RequireRole>
        ),
      },
      {
        path: 'auditoria',
        element: (
          <RequireRole roles={[ROLES.ADMIN]}>
            <AuditLogPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <p className="p-6 text-slate-500">Ruta no encontrada.</p> },
]);