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
})