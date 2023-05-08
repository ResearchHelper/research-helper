import ProgressDialog from "./ProgressDialog.vue";

describe("<ProgressDialog />", () => {
  it("renders btn-ok disabled", () => {
    let props = {
      modelValue: true,
      progress: Math.random() * 0.999,
      errors: [],
    };
    cy.mount(ProgressDialog, { props });
    cy.dataCy("btn-ok").should("be.disabled");
  });

  it("renders btn-ok not disabled", () => {
    let props = {
      modelValue: true,
      progress: 1.0,
      errors: [],
    };
    cy.mount(ProgressDialog, { props });
    cy.dataCy("btn-ok").should("not.be.disabled");
  });

  it("renders errors", () => {
    let props = {
      modelValue: true,
      progress: Math.random() * 0.999,
      errors: [new Error("error 1"), new Error("error 2")],
    };
    cy.mount(ProgressDialog, { props });
    for (let i = 0; i < props.errors.length; i++)
      cy.dataCy(`error-prompt-${i}`).should("exist");
  });
});
