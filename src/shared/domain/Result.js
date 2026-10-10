export class Result {
  constructor(ok, value = null, error = null) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }

  static success(value = null) {
    return new Result(true, value, null);
  }

  static failure(error) {
    return new Result(false, null, error);
  }

  isSuccess() {
    return this.ok;
  }

  isFailure() {
    return !this.ok;
  }

  getOrThrow() {
    if (this.isFailure()) throw this.error;
    return this.value;
  }
}
