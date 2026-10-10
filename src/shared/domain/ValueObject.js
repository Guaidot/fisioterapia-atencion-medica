import { DomainError } from './DomainError.js';

export class ValueObject {
  constructor(value) {
    this.value = value;
    Object.freeze(this);
  }

  equals(other) {
    if (!(other instanceof ValueObject)) return false;
    return this.value === other.value;
  }

  toString() {
    return String(this.value);
  }

  assert(condition, message) {
    if (!condition) {
      throw new DomainError(message, 'INVALID_VALUE_OBJECT');
    }
  }
}
