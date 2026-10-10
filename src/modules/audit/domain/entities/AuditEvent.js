import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

const ENTITY_TYPES = ['patient', 'clinical_evaluation'];
const ACTIONS = ['INSERT', 'UPDATE', 'DELETE'];

export class AuditEvent extends Entity {
  constructor({
    id,
    entityType,
    recordId,
    patientId = null,
    action,
    actorId = null,
    actorName = null,
    actorEmail = null,
    occurredAt,
    oldData = null,
    newData = null,
  }) {
    super(id);
    if (!ENTITY_TYPES.includes(entityType)) {
      throw new DomainError('Tipo de registro de auditoría inválido.');
    }
    if (!ACTIONS.includes(action)) {
      throw new DomainError('Acción de auditoría inválida.');
    }
    if (!recordId || !occurredAt) {
      throw new DomainError('El registro de auditoría está incompleto.');
    }

    this.entityType = entityType;
    this.recordId = recordId;
    this.patientId = patientId;
    this.action = action;
    this.actorId = actorId;
    this.actorName = actorName;
    this.actorEmail = actorEmail;
    this.occurredAt = occurredAt;
    this.oldData = oldData;
    this.newData = newData;
  }

  toPrimitives() {
    return {
      id: this.id,
      entityType: this.entityType,
      recordId: this.recordId,
      patientId: this.patientId,
      action: this.action,
      actorId: this.actorId,
      actorName: this.actorName,
      actorEmail: this.actorEmail,
      occurredAt: this.occurredAt,
      oldData: this.oldData,
      newData: this.newData,
    };
  }
}
