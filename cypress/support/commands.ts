/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
import '@testing-library/cypress/add-commands'

Cypress.Commands.addAll({
  setSchema: (schema: string) => {
    const schemaField = cy.get("#schema-container .cm-content")
    schemaField.type(Cypress.platform === "darwin" ? "{meta}" : "{ctrl}", { release: false })
    schemaField.type("a", { release: false })
    schemaField.type("{backspace}")

    schemaField.invoke("text", schema)
  },
  submitAndCheck: (callback: ((value: object) => void)) => {
    cy.findByRole("button", { name: /Try it/i }).click({force: true}).should(() => {
      const value = JSON.parse(localStorage.getItem("value"))
      callback(value)
      //expect(callback(value)).to.be.true
    })
  }
});