import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export class EvaScore extends ValueObject {
  constructor(value) {
    super(Number(value));
    this.assert(
      Number.isFinite(this.value) && this.value >= 0 && this.value <= 10,
      'Escala EVA inválida: debe ser un número entre 0 y 10.',
    );
  }

  get level() {
    if (this.value === 0) return 'sin dolor';
    if (this.value <= 3) return 'leve';
    if (this.value <= 6) return 'moderado';
    return 'severo';
  }
}