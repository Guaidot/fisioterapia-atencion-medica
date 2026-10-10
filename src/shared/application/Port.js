export class Port {
  constructor() {
    if (new.target === Port) {
      throw new TypeError('Port es un contrato abstracto y no puede instanciarse.');
    }
  }
}
