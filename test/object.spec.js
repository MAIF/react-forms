import { testBasicConstraints } from './testUtils';


describe('Object resolver', () => {
  it('should resolve object constraints', () => {
    const message = `test must be a \`object\` type, but the final value was: \`null\` (cast from the value \`"fifou"\`).\n If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``
    const testConstraints = []

    const right = { test: {foo: 'bar'} }
    const wrong = { test: 'fifou' }

    return testBasicConstraints(testConstraints, message, right, wrong, 'object')
  })
})