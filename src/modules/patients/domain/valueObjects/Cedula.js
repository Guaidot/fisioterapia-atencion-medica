import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export class Cedula extends ValueObject {
  constructor(value) {
    super(value);
    this.assert(
      typeof value === 'string' && /^[0-9]{6,10}$/.test(value.trim()),
      'Cédula inválida: debe contener entre 6 y 10 dígitos.',
    );
  }
}