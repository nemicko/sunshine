export class RequiredFieldError extends Error {
  constructor (field: string) {
    super(`Missing required field: '${field}'`);
  }
}

export class InvalidFieldTypeError extends Error {
  constructor (type: string, field: string) {
    super(`Field '${field}' must be of type '${type}'`);
  }
}

export class InvalidNumberValueError extends Error {
  constructor (value: number, min?: number, max?: number) {
    super(`Provided value '${value}' must be ${min ? 'bigger' : 'smaller'} than '${min || max}'`)
  }
}

export class StringNotMatchingRegExpError extends Error {
  constructor (value: string, match: string) {
    super(`Provided value '${value}' is not matching RegExp ${match}`)
  }
}

export class InvalidDateValueError extends Error {
  constructor (value: Date, min?: Date, max?: Date) {
    super(`Provided value '${value}' must be ${min ? 'bigger' : 'smaller'} than '${min || max}'`)
  }
}
