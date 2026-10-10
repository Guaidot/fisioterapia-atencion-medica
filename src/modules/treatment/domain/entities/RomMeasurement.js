import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

const SIDES = ['izquierdo', 'derecho', 'bilateral'];

export class RomMeasurement extends Entity {
  constructor({
    id = null,
    clinicalEvaluationId,
    joint,
    movement,
    side = null,
    degrees,
    referenceMinDegrees = null,
    referenceMaxDegrees = null,
    notes = '',
    createdBy = null,
    createdAt = null,
  }) {
    super(id);
    this.assertRequired(clinicalEvaluationId, 'Evaluación clínica');
    this.assertRequired(joint?.trim(), 'Articulación');
    this.assertRequired(movement?.trim(), 'Movimiento');
    if (joint.trim().length > 100 || movement.trim().length > 100) {
      throw new DomainError('Articulación y movimiento no pueden superar 100 caracteres.');
    }
    if (!Number.isFinite(degrees) || degrees < 0 || degrees > 360) {
      throw new DomainError('El rango de movimiento debe estar entre 0 y 360 grados.');
    }
    if (side != null && !SIDES.includes(side)) {
      throw new DomainError('Lado corporal inválido.');
    }
    for (const [value, field] of [
      [referenceMinDegrees, 'El mínimo de referencia'],
      [referenceMaxDegrees, 'El máximo de referencia'],
    ]) {
      if (value != null && (!Number.isFinite(value) || value < 0 || value > 360)) {
        throw new DomainError(`${field} debe estar entre 0 y 360 grados.`);
      }
    }
    if (
      referenceMinDegrees != null &&
      referenceMaxDegrees != null &&
      referenceMinDegrees > referenceMaxDegrees
    ) {
      throw new DomainError('El rango de referencia mínimo no puede superar al máximo.');
    }

    this.clinicalEvaluationId = clinicalEvaluationId;
    this.joint = joint.trim();
    this.movement = movement.trim();
    this.side = side;
    this.degrees = degrees;
    this.referenceMinDegrees = referenceMinDegrees;
    this.referenceMaxDegrees = referenceMaxDegrees;
    this.notes = notes?.trim() ?? '';
    this.createdBy = createdBy;
    this.createdAt = createdAt;
  }

  assertRequired(value, field) {
    if (!value) throw new DomainError(`${field} es obligatorio.`);
  }

  toPrimitives() {
    return {
      id: this.id,
      clinicalEvaluationId: this.clinicalEvaluationId,
      joint: this.joint,
      movement: this.movement,
      side: this.side,
      degrees: this.degrees,
      referenceMinDegrees: this.referenceMinDegrees,
      referenceMaxDegrees: this.referenceMaxDegrees,
      notes: this.notes,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
    };
  }
}
