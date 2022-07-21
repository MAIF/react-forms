describe('type text', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/react-forms')
  })

  it('should accept default values', () => {
    cy.setSchema(`{
      name: {
        type: "string",
        defaultValue: "foo"
      }
    }`)

    cy.findByRole("textbox", { name: /name/i }).should('have.value', "foo")
    cy.submitAndCheck(value => {
      expect(value.name).to.eq("foo")
    })
  })

  it('should allow to change value', () => {
    cy.setSchema(`{
      name: {
        type: "string"
      }
    }`)

    cy.findByRole("textbox", { name: /name/i }).type("bar")
    cy.submitAndCheck(value => {
      expect(value.name).to.eq("bar")
    })
  })

  it('should not be displayed if visible is false', () => {
    cy.setSchema(`{
      name: {
        type: "string",
        visible: false
      }
    }`)

    cy.findByRole("textbox", { name: /name/i }).should("not.exist")
  })

  it('should not allow input when disabled', () => {
    cy.setSchema(`{
      name: {
        type: "string",
        disabled: true
      }
    }`)

    cy.findByRole("textbox", { name: /name/i }).should('have.attr', 'readonly', 'readonly')
  })

  it('allow label modification', () => {
    cy.setSchema(`{
      name: {
        type: "string",
        label: "nome"
      }
    }`)

    cy.findByRole("textbox", { name: /nome/i }).should('exist')
  })

  it('should allow specific onChange callback', () => {
    cy.setSchema(`{
      name: {
        type: "string",
        onChange: ({rawValues, value, setValue}) => {
          setValue('name', value + "" +value)
        }
      }
    }`)
    cy.findByRole("textbox", { name: /name/i }).type('a')
    cy.submitAndCheck(value => {
      expect(value.name).to.eq("aa")
    })
  })
})