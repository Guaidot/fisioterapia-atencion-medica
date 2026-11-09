# Plan de implementacion de reglas de negocio

## Objetivo

Usar la especificacion consolidada como alcance funcional, completar primero las brechas de las etapas inicial y siguiente, y reservar las recomendaciones clinicas y alertas automaticas para una etapa posterior con reglas aprobadas por la clinica.

Este documento registra el estado del codigo y las decisiones funcionales confirmadas el 20 de octubre de 2026. "Parcial" significa que existe una base utilizable, pero no se cumplen todos los comportamientos descritos.

El uso previsto actualmente es personal: una pasante de fisioterapia llevara su propio registro y apoyara sus practicas. No se ha indicado que vaya a desplegarse para una clinica. Las migraciones existentes hasta la 0015 fueron aplicadas en Supabase, segun confirmacion de la responsable del proyecto. La responsable confirma que actualmente solo hay dos cuentas conocidas; no se agregara una migracion para inactivar perfiles nuevos. El registro publico se quito de la interfaz y del flujo cliente; si se necesita impedir altas directas fuera de la aplicacion, desactivar los registros en Auth del proyecto Supabase.

La informacion de ejercicios y otros contenidos se ha recopilado de fuentes publicas, incluidas fuentes oficiales, pero no consta una revision independiente por un profesional responsable. Mantener recomendaciones y alertas automaticas fuera del alcance hasta que el contenido y sus limites tengan una revision apropiada. La Fase 4 no se inicia por ahora.

## Decisiones confirmadas

- Mantener cedula numerica obligatoria y unica.
- Mantener diagnostico, tipo de lesion, zona y fase como obligatorios; EVA es opcional y no se debe inferir como 0 cuando no se midio.
- Permitir correcciones de sesiones existentes mediante ediciones auditadas. La fecha de creacion y el autor originales se conservan; la bitacora administrativa registra los cambios.
- Usar `America/Caracas` para mostrar y capturar fecha/hora clinica. La hora de medicion de signos vitales es independiente de la hora de registro.
- La migracion 0013 de la Fase 1 esta aplicada en Supabase.
- Las Fases 1 y 2 estan implementadas; las migraciones 0013-0015 se reportaron aplicadas en Supabase.
- La Fase 3 esta implementada en codigo. La responsable ejecuto la migracion 0016 en Supabase y confirmo como `OK` las consultas de verificacion de tabla, RLS, columnas, politicas, funciones y triggers.
- Para la agenda: no se asigna profesional y la duracion es opcional; no se exige motivo de cancelacion.
- Para la pauta: se usa el logo de la fisioterapeuta y la revision profesional se confirma explicitamente. La vista del navegador no puede confirmar que el usuario guardo un archivo PDF.
- Para catalogos terapeuticos: el administrador mantiene ejercicios y agentes; las terapeutas consultan el catalogo, seleccionan elementos y pueden agregar ejercicios nuevos, pero no editar/desactivar registros ni administrar agentes. Se cargan como base los ejercicios visuales existentes y los agentes mencionados en la especificacion; los parametros de agentes son opcionales y sin dosis sugeridas.

## Flujo funcional de extremo a extremo

El flujo de referencia es: registrar o localizar paciente -> iniciar una sesion/atencion -> capturar triaje y antecedentes disponibles -> documentar evaluacion funcional -> registrar mediciones e intervenciones -> revisar y entregar la pauta si aplica -> programar o actualizar una cita.

Una cita no equivale a una sesion. Solo una atencion efectivamente realizada genera una sesion clinica. Cada nueva sesion agrega informacion al historial del paciente y no debe reemplazar sesiones previas. Las sugerencias, referencias y alertas son apoyo al profesional; no diagnostican, prescriben ni autorizan o bloquean tratamientos.

## Principios de arquitectura e implementacion

- Mantener entidades y reglas en el dominio; los casos de uso coordinan operaciones; los puertos definen persistencia, catalogos, recursos e informes; los adaptadores conectan Supabase, interfaz y generacion de documentos.
- Reutilizar la arquitectura hexagonal ya presente. Probar las reglas de negocio aisladas de React, Supabase y otros servicios externos.
- Usar Factory para seleccionar adaptadores o estrategias solo cuando exista una variante real. Usar Singleton para recursos compartidos sin estado clinico mutable; nunca para datos de pacientes, sesiones o tratamientos.
- Mantener permisos tanto en la experiencia de usuario como en la seguridad de base de datos. El catalogo terapeutico ya restringe su administracion a administradores; la agenda sigue pendiente.
- Los catalogos clinicos y recursos visuales deben poder actualizarse por responsables autorizados sin modificar las entidades centrales ni codificar reglas clinicas en la interfaz.
- Los casos de uso se mantienen por operacion (registrar/consultar/corregir evaluaciones, guardar mediciones e intervenciones, generar una pauta y gestionar citas); no crear servicios globales de negocio ni introducir patrones sin una variante o necesidad concreta.

## Estado actual por requisito

| Seccion | Estado | Implementado | Brecha principal |
| --- | --- | --- | --- |
| 1. Proposito y alcance | Parcial | Hay registro de evaluaciones, tratamientos, mediciones y pautas de ejercicios. Algunas vistas indican que la comparacion no es una conclusion clinica. | No hay un flujo de aprobacion clinica formal. Mantener cualquier sugerencia futura como apoyo sujeto a revision profesional. |
| 2. Conceptos y relaciones | Parcial | Pacientes, evaluaciones clinicas, intervenciones y mediciones estan separados y relacionados. Las evaluaciones se muestran en orden cronologico; la hora de creacion y el autor originales se preservan en ediciones. | No hay una entidad de sesion explicita ni citas. La evaluacion actual funciona como registro de atencion; sus correcciones modifican el registro vigente y dependen de la bitacora de cambios para auditoria. |
| 3. Pacientes | Parcial | Nombre, apellido, cedula y genero son obligatorios; la cedula es unica en la base de datos. Edad se calcula desde la fecha de nacimiento. Telefono y ocupacion son opcionales. Al detectar una cedula repetida, el flujo permite revisar el paciente existente. | La especificacion permite que la clinica decida si requiere cedula u otro identificador; el sistema exige cedula numerica. Revisar si se debe admitir otro identificador. |
| 4. Triaje y antecedentes | Parcial | Se capturan los cuatro signos vitales, medicamentos, sueño y calidad del sueno. Se muestran unidades y se valida que la presion tenga ambos valores. Se registra fecha/hora de medicion independiente en zona `America/Caracas` para nuevas capturas de signos vitales; el dominio exige esa hora al crear mediciones nuevas. | Las alertas configurables no existen; no agregar umbrales implicitos. Los registros previos a la migracion no tienen una hora de medicion recuperable. Revisar si las opciones de genero y medicamentos reflejan la politica de la clinica. |
| 5. Evaluacion y diagnostico funcional | Parcial | Se guardan diagnostico libre, tipo de lesion, zona, fase, EVA opcional y observaciones clinicas por evaluacion. | Diagnostico, lesion, zona y fase siguen siendo obligatorios por decision. No hay catalogo administrable de diagnosticos ni recurso anatomico asociado en la interfaz. |
| 6. Recomendaciones terapeuticas | Pendiente / posterior | No se encontro un motor de recomendaciones ni catalogos de objetivos, precauciones o contraindicaciones. | Definir y mantener catalogos, reglas de coincidencia y mensaje para ausencia de resultados. No desarrollar hasta validacion clinica; la seleccion siempre sera del profesional. |
| 7. Agentes fisicos y electroterapia | Parcial | Las intervenciones pueden referenciar elementos activos del catalogo mantenido por administradores y consultable por terapeutas. El catalogo define que campos y unidades se pueden capturar; son opcionales y no incluyen dosis predeterminadas. | No existen esquemas de parametros preconfigurados ni recursos visuales de equipos/colocacion; la clinica debe revisar los campos aplicables para cada agente. |
| 8. Ejercicios y goniometria | Parcial | Los ejercicios visuales actuales y los agentes nombrados como ejemplos se cargan al catalogo inicial; las terapeutas pueden consultar, seleccionar y agregar ejercicios. Las mediciones y comparaciones siguen ligadas a cada evaluacion. | Las terapeutas no pueden editar/desactivar ejercicios existentes. No se implementan sugerencias clinicas ni catalogo de rangos de referencia; los recursos visuales adicionales requieren carga y revision autorizadas. |
| 9. Reportes y pauta PDF | Parcial | Se genera una vista de impresion con los ejercicios seleccionados, dosis, ilustraciones y logo; se informa si el navegador bloquea la ventana. La confirmacion profesional queda persistida y se invalida si cambian los ejercicios. | La salida depende de imprimir/guardar desde el navegador; la aplicacion no puede confirmar que se guardo un archivo. Faltan datos configurables del consultorio y seleccion del resumen clinico. |
| 10. Agenda y asistencia | Implementada; estructura verificada en Supabase | El modulo de citas tiene estados, filtros, historial de reprogramacion, enlace para iniciar evaluacion y programacion de la siguiente cita desde el paciente. La responsable confirma que la migracion 0016 esta presente y los controles SQL consultados resultaron `OK`. | Falta probar el flujo con un paciente real o de prueba: crear cita, registrar atencion, reprogramar, cancelar e inasistencia. Una cita no crea por si sola una sesion. |
| 11. Historial y seguimiento | Parcial | El paciente muestra evaluaciones cronologicas, citas relacionadas y grafica EVA; la goniometria compara mediciones compatibles. La atencion desde agenda conserva la cita asociada. | Las correcciones actualizan el registro vigente y dependen de la bitacora para auditar cambios. La grafica presenta datos sin interpretacion clinica automatica. |
| 12. Arquitectura | Parcial / mayormente presente | Hay entidades y casos de uso, puertos, adaptadores Supabase, inyeccion y Factory; el contenedor comparte dependencias sin estado clinico mutable. El acceso de catalogo y agenda se restringe en UI y base de datos. | Completar pruebas de integracion de flujos y permisos contra Supabase. Algunas validaciones permanecen duplicadas por la interfaz. |
| 13. Etapas | Pendiente de ejecutar | La especificacion ya propone etapas. | Usar las fases de este plan para convertir el alcance en cambios verificables, sin duplicar lo que ya esta implementado. |

## Decisiones funcionales previas

Resolver estas preguntas antes de cambiar esquemas o validaciones:

1. Identificacion: **resuelto**. Mantener cedula obligatoria, numerica y unica.
2. Obligatoriedad por sesion: **resuelto**. Diagnostico, tipo de lesion, zona y fase obligatorios; EVA opcional.
3. Historial: **resuelto para esta fase**. Permitir correcciones auditadas, manteniendo fecha/autor originales y bitacora de cambios; no presentar una correccion como una nueva sesion.
4. Fecha/hora: **resuelto**. Usar `America/Caracas`; registrar aparte la fecha/hora de medicion de signos vitales.
5. Catalogos: **resuelto para ejercicios y agentes fisicos**. Los administra el administrador; el personal clinico puede consultarlos. Los agentes empiezan sin parametros configurados y el administrador habilita los campos/unidades aplicables. Responsable y fuente de rangos de referencia y contraindicaciones siguen pendientes.
6. Pauta domiciliaria: la identidad visual usa el logo de la fisioterapeuta; la revision profesional se confirma explicitamente antes de considerar la pauta revisada. La app solo puede confirmar que abrio la vista de impresion, no que se guardo el PDF.
7. Agenda: no requiere profesional asignado ni motivo obligatorio de cancelacion; la duracion es opcional y la reprogramacion conserva el registro original.
8. Roles y permisos: revisar que acciones puede realizar cada rol sobre pacientes, sesiones, tratamientos, catalogos, reportes y agenda; validar que cada regla se aplique en interfaz y base de datos.
9. Proteccion y respaldo: acordar politicas de acceso a datos clinicos, retencion, respaldo, restauracion y manejo de incidentes, considerando las capacidades y configuracion del entorno de despliegue.
10. Fuentes y responsables clinicos: acordar quien aprueba y mantiene catalogos, rangos de referencia, recomendaciones y contraindicaciones, y que fuentes autorizadas se usaran. Las alertas solo se configuran con limites y condiciones aprobados por la clinica.
11. Recursos visuales: definir fuentes/licencias, responsable de revision, asociacion con catalogos y tratamiento cuando una imagen o recurso no este disponible.
12. Reportes: confirmar identidad visual, datos de contacto del consultorio, datos clinicos minimos que pueden incluirse y mecanismo de revision antes de entregar.

No definir limites de signos vitales, contraindicaciones ni recomendaciones automaticamente sin aprobacion clinica.

## Hoja de ruta

### Fase 0 - Cerrar decisiones y criterios de aceptacion

**Estado: completada para las fases 1 y 2.** Las decisiones que afectan identificacion, obligatoriedad de la sesion, correcciones, zona horaria, responsable de catalogo, elementos de partida y orden de fases quedaron confirmadas.

- Resolver las decisiones anteriores con la clinica.
- Convertir cada regla en ejemplos de entrada valida/invalida y resultados esperados.
- Acordar datos obligatorios por entidad y politica de correccion del historial.
- Identificar catalogos que necesitan mantenimiento por usuarios autorizados.
- Confirmar permisos por rol, controles de datos y pruebas de respaldo/restauracion aplicables al entorno.
- Validar fuentes y responsables de contenido clinico y visual antes de cargar recomendaciones o referencias.

**Lista para avanzar cuando:** las decisiones que cambian el modelo de datos, la obligatoriedad o la seguridad clinica estan aprobadas.

### Fase 1 - Completar etapa inicial: paciente, sesion, triaje e historial

**Estado: implementada en codigo y aplicada en Supabase.** EVA ya es opcional, se agregaron observaciones clinicas y fecha/hora de medicion independiente en `America/Caracas`; la hora es obligatoria en signos vitales nuevos y las correcciones de valores antiguos sin hora conservan ese dato como desconocido. La cedula unica y la auditoria de correcciones ya existian.

- Alinear la identificacion del paciente con la politica acordada y conservar la deteccion de duplicados.
- Formalizar el registro por sesion: fecha/hora y profesional; mantener signos vitales, dolor, diagnostico, mediciones y tratamiento ligados a esa atencion.
- Agregar observaciones clinicas y soportar los campos opcionales acordados sin perder validaciones de formato y unidades.
- Registrar fecha/hora de medicion cuando se requiera, con zona horaria definida.
- Evitar que una nueva atencion altere las anteriores. Implementar inmutabilidad o correcciones auditadas segun la decision de Fase 0.
- Mantener y probar el historial cronologico y la comparacion de mediciones equivalentes.
- No mostrar alertas automaticas hasta que existan reglas aprobadas y configurables.

**Criterios de aceptacion:** se puede registrar una nueva atencion sin cambiar las anteriores; cada dato clinico pertenece a una atencion identificable; los campos opcionales acordados no bloquean el guardado; los errores de validacion se expresan claramente.

### Fase 2 - Completar catalogos e intervenciones basicas

**Estado: implementada en codigo; migraciones 0014 y 0015 aplicadas en Supabase.**

- Definir catalogos basicos de ejercicios, agentes fisicos, lesiones/zonas y recursos visuales, con adaptadores/puertos apropiados para su mantenimiento.
- Permitir buscar/seleccionar ejercicios y agentes sin impedir el registro manual cuando corresponda.
- Configurar los campos y unidades de tratamiento segun el agente/modalidad; no exigir parametros que no apliquen.
- Asociar recursos graficos al catalogo y tolerar recursos faltantes sin romper la evaluacion.
- Mantener rangos de referencia de goniometria como referencias identificadas, no como conclusiones. Si se aprueba un catalogo, obtenerlos desde este y no pedirlos repetidamente en cada medicion.
- Asegurar que las mediciones se comparen solo si articulacion, movimiento y lado coinciden cuando aplique.
- Se implemento el catalogo mantenible de ejercicios y agentes con consulta para personal clinico y edicion exclusiva de administradores; los elementos existentes se cargan por migracion.
- Se habilito la asociacion de intervenciones a elementos activos, conservando nombre/ilustracion como datos historicos, y se incorporo configuracion de campos/unidades para agentes sin dosis por defecto.
- Los agentes del catalogo inician sin campos configurados; esto evita asumir que una modalidad requiere frecuencia, intensidad, duracion o modo antes de revision clinica.
- Validacion de codigo: 26 pruebas enfocadas pasaron en 8 archivos y `npm run build` finalizo correctamente. El build conserva la advertencia existente de bundle superior a 500 kB.
- Se ajustaron los permisos para que las terapeutas puedan consultar el catalogo y los administradores sigan siendo los unicos que lo mantienen.
- Se permite a terapeutas activas insertar ejercicios nuevos; no pueden insertar agentes ni editar o desactivar elementos existentes.

**Criterios de aceptacion:** pueden registrarse las modalidades acordadas con sus parametros aplicables; la falta de imagen o referencia no impide guardar; las referencias se distinguen de la valoracion profesional.

### Fase 3 - Completar salida y seguimiento

**Estado: implementada en codigo; migracion 0016 aplicada y estructura verificada por consultas de solo lectura en Supabase.** El PDF con logo y la agenda estan conectados en codigo, incluida la asociacion entre una cita y la evaluacion creada al registrar una atencion. El historial presenta las citas relacionadas y la evolucion EVA, y permite iniciar la programacion de una cita con el paciente preseleccionado. La revision de la pauta requiere confirmacion explicita y se invalida cuando cambian sus ejercicios. El flujo con datos reales queda pendiente hasta que existan pacientes registrados.

Validacion local registrada: `npm test` paso con 131 pruebas en 34 archivos; `npm run build` finalizo correctamente. El build mantiene la advertencia existente de chunk JavaScript superior a 500 kB. La validacion SQL se realizo en el proyecto alojado mediante consultas de solo lectura y los objetos consultados aparecieron como `OK`; no se ejecuto una prueba integral de escrituras/flujo clinico porque no hay pacientes de prueba.

- Confirmar identidad/contacto del consultorio y datos que se incluiran.
- Permitir incluir solo ejercicios seleccionados y, opcionalmente, mediciones o indicaciones clinicas seleccionadas.
- Minimizar datos del paciente incluidos y probar que las imagenes pueden cargarse al imprimir.
- Validar que la vista de impresion se abra y que sus errores se informen; la confirmacion de revision no implica que el navegador guardo el archivo.
- Probar persistencia, permisos por rol, auditoria y transiciones de citas directamente en el entorno de Supabase cuando se disponga de datos de prueba.
- Probar el recorrido desde una cita hasta guardar una nueva evaluacion del mismo paciente y confirmar el estado atendido.
- Probar reprogramacion, cancelacion, inasistencia y filtros contra datos persistidos.
- Mantener cita y sesion como registros distintos; crear la sesion solo cuando se registre la atencion.
- Revisar evolucion de dolor y mediciones en forma grafica, como presentacion de los registros y sin generar conclusiones clinicas automaticas.

**Criterios de aceptacion:** la pauta contiene solo los datos elegidos, muestra las dosis indicadas y permite confirmar la revision profesional; los errores de generacion no se presentan como exito. La agenda conserva el historial de reprogramaciones, los filtros reflejan los estados persistidos y una cita sin atencion no aparece como sesion clinica. Las comparaciones muestran solo mediciones compatibles.

### Fase 4 - Mejoras posteriores: alertas y apoyo terapeutico

- Incorporar catalogos de objetivos, ejercicios, precauciones y contraindicaciones solo despues de que el contenido y mantenimiento sean aprobados por la clinica.
- Incorporar alertas de signos vitales solo con limites/condiciones configurables y validados por la clinica; registrar que se mostro y fue revisada si asi se acuerda.
- En todas las sugerencias, indicar claramente que son apoyo informativo, permitir continuar manualmente y dejar la seleccion/decision final al profesional.

**Criterios de aceptacion:** no hay umbrales clinicos por defecto; las sugerencias sin coincidencias se explican claramente; ninguna alerta o recomendacion diagnostica, prescribe, bloquea o autoriza automaticamente un tratamiento.

## Validacion transversal

- Probar reglas de dominio y casos de uso sin montar la interfaz ni conectarse a Supabase.
- Probar mapeos y restricciones de base de datos para mantener coherencia con las reglas de dominio.
- Probar flujos de interfaz para campos opcionales, errores, persistencia y accesibilidad.
- Probar que los registros historicos conservan su relacion paciente-sesion y que los cambios/correcciones respetan la politica acordada.
- Probar permisos por rol tanto en las operaciones visibles como en las politicas de base de datos; verificar procedimientos de respaldo y restauracion con el entorno de despliegue.
- Validar en escenarios concretos reprogramaciones, inasistencias, generacion fallida del reporte y recursos/catalogos no disponibles antes de ampliar el alcance.
- Ejecutar pruebas existentes del modulo afectado y compilacion de produccion en cada fase.
- Mantener el historial de migraciones: no modificar migraciones ya aplicadas; agregar migraciones nuevas para cambios de esquema.
