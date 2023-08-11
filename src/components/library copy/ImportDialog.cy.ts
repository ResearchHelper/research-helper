import ImportDialog from "./ImportDialog.vue";

describe("<ImportDialog />", () => {
  it("cancel", () => {
    const vue = cy.mount(ImportDialog, { props: { show: true } });
    cy.dataCy("btn-cancel").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
    });
  });

  it("confirm createFolder=true", () => {
    const vue = cy.mount(ImportDialog, { props: { show: true } });
    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      expect(wrapper.emitted("confirm")).to.eql([[true]]);
    });
  });

  it("confirm createFolder=false", () => {
    const vue = cy.mount(ImportDialog, { props: { show: true } });
    cy.get(".q-checkbox").click();
    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      expect(wrapper.emitted("confirm")).to.eql([[false]]);
    });
  });
});
