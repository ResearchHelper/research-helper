import DeleteDialog from "./DeleteDialog.vue";
function mount(deleteFromDB: boolean) {
  let projects = [
    { title: "title1" },
    { title: "title2" },
    { title: "title3" },
  ];
  let props = {
    show: true,
    projects: projects,
    deleteFromDB: deleteFromDB,
  };
  return cy.mount(DeleteDialog, { props });
}
describe("<DeleteDialog />", () => {
  it("renders with deleteFromDB=true", () => {
    mount(true);
    cy.contains("* This operation is not reversible").should("exist");
    cy.contains("* Notes in this project will be deleted").should("exist");
  });

  it("renders with deleteFromDB=false", () => {
    mount(false);
    cy.contains("* This operation is not reversible").should("not.exist");
    cy.contains("* Notes in this project will be deleted").should("not.exist");
  });

  it("cancel", () => {
    const vue = mount(true);
    cy.dataCy("btn-cancel").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
    });
  });

  it("confirm", () => {
    const vue = mount(true);
    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      expect(wrapper.emitted("confirm")).to.have.length(1);
    });
  });
});
