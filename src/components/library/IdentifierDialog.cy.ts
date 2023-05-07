import IdentifierDialog from "./IdentifierDialog.vue";

describe("<IdentifierDialog />", () => {
  it("renders", () => {
    cy.mount(IdentifierDialog, { props: { show: true } });
    cy.dataCy("btn-confirm").should("be.disabled");
  });

  it("cancel", () => {
    const vue = cy.mount(IdentifierDialog, { props: { show: true } });
    cy.dataCy("btn-cancel").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
    });
  });

  it("confirm", () => {
    const vue = cy.mount(IdentifierDialog, { props: { show: true } });
    cy.dataCy("identifier-input").type("test-identifier");
    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      expect(wrapper.emitted("confirm")).to.eql([["test-identifier"]]);
    });
  });
});
