import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export class Age extends ValueObject {
  constructor(birthDate) {
    const age = Age.calculate(birthDate);
    super(age);
    this.assert(
      age !== null && age >= 0 && age <= 130,
      'Edad inválida: no se puede calcular a partir de la fecha de nacimiento.',
    );
  }

  static calculate(birthDate) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }
}