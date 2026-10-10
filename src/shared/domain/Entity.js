export class Entity {
  constructor(id = null) {
    this.id = id;
  }

  get isNew() {
    return this.id === null || this.id === undefined;
  }

  equals(other) {
    if (!other) return false;
    return this.id === other.id;
  }
}
