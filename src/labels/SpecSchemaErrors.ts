export interface ISpecSchemaError {
  type: 'error' | 'warning',
  title: string,
  text: string[]
}

class SpecSchemaErrors {
  private _errors: ISpecSchemaError[] = []
  private _warnings: ISpecSchemaError[] = []

  constructor () {}

  add(error: ISpecSchemaError) {
    switch (error.type) {
      case 'error':
        this._errors.push(error)
        break;
      case 'warning':
        this._warnings.push(error)
        break;
    }
  }

  hasErrors(): boolean {
    return !!this._errors.length
  }

  hasWarnings(): boolean {
    return !!this._warnings.length
  }

  getErrorCount(): number {
    return this._errors.length
  }

  getWarningCount(): number {
    return this._warnings.length
  }

  get errors() {
    return this._errors
  }

  get warnings() {
    return this._warnings
  }
}

export default SpecSchemaErrors
