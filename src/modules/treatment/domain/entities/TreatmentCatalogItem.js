import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';
import { getExerciseIllustration } from '../../exerciseIllustrations.js';

export const TREATMENT_CATALOG_KINDS = ['exercise', 'physical_agent'];

export const AGENT_PARAMETER_FIELDS = [
  'technicalFrequencyHz',
  'intensity',
  'applicationMinutes',
  'mode',
];

export const INTENSITY_UNITS = ['mA', 'W', 'W/cm2'];

export class TreatmentCatalogItem extends Entity {
  constructor({
    id = null,
    kind,
    code,
    name,
    description = '',
    active = true,
    illustrationKey = null,
    parameterConfig = {},
    createdBy = null,
    createdAt = null,
    updatedAt = null,
  }) {
    super(id);
    if (!TREATMENT_CATALOG_KINDS.includes(kind)) {
      throw new DomainError('Tipo de elemento de catálogo inválido.');
    }
    if (typeof code !== 'string' || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(code)) {
      throw new DomainError('El código debe contener letras minúsculas, números y guiones.');
    }
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 200) {
      throw new DomainError('El nombre es obligatorio y no puede superar 200 caracteres.');
    }
    if (typeof description !== 'string' || description.length > 1000) {
      throw new DomainError('La descripción no puede superar 1000 caracteres.');
    }
    if (typeof active !== 'boolean') {
      throw new DomainError('El estado del catálogo no es válido.');
    }
    if (kind === 'exercise') {
      if (illustrationKey != null && !getExerciseIllustration(illustrationKey)) {
        throw new DomainError('La ilustración seleccionada no existe en el catálogo visual.');
      }
      if (
        parameterConfig == null ||
        typeof parameterConfig !== 'object' ||
        Array.isArray(parameterConfig) ||
        Object.keys(parameterConfig).length > 0
      ) {
        throw new DomainError('Los ejercicios no admiten parámetros de agente físico.');
      }
      this.parameterConfig = {};
    } else {
      if (illustrationKey != null) {
        throw new DomainError('Los agentes físicos no admiten ilustraciones de ejercicios.');
      }
      this.parameterConfig = TreatmentCatalogItem.assertAgentParameterConfig(parameterConfig);
    }

    this.kind = kind;
    this.code = code;
    this.name = name.trim();
    this.description = description.trim();
    this.active = active;
    this.illustrationKey = illustrationKey;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static assertAgentParameterConfig(config) {
    if (
      config == null ||
      typeof config !== 'object' ||
      Array.isArray(config) ||
      Object.keys(config).some((key) => !['fields', 'intensityUnits'].includes(key))
    ) {
      throw new DomainError('La configuración de parámetros del agente no es válida.');
    }

    const fields = config.fields ?? [];
    const intensityUnits = config.intensityUnits ?? [];
    if (
      !Array.isArray(fields) ||
      fields.some((field) => !AGENT_PARAMETER_FIELDS.includes(field)) ||
      new Set(fields).size !== fields.length
    ) {
      throw new DomainError('La lista de parámetros del agente no es válida.');
    }
    if (
      !Array.isArray(intensityUnits) ||
      intensityUnits.some((unit) => !INTENSITY_UNITS.includes(unit)) ||
      new Set(intensityUnits).size !== intensityUnits.length
    ) {
      throw new DomainError('Las unidades de intensidad configuradas no son válidas.');
    }
    if (fields.includes('intensity') !== (intensityUnits.length > 0)) {
      throw new DomainError('Configura unidades solo cuando se habilite la intensidad.');
    }

    return {
      fields: [...fields],
      intensityUnits: [...intensityUnits],
    };
  }

  toPrimitives() {
    return {
      id: this.id,
      kind: this.kind,
      code: this.code,
      name: this.name,
      description: this.description,
      active: this.active,
      illustrationKey: this.illustrationKey,
      parameterConfig: this.parameterConfig,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
