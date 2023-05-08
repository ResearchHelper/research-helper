import DeleteDialog from "./DeleteDialog.vue";

describe("<DeleteDialog />", () => {
  it("renders with deleteFromDB=true", () => {
    let props = {
      show: true,
      projectTitle: "test title",
      deleteFromDB: true,
    };
    cy.mount(DeleteDialog, { props });
    cy.contains("* This operation is not reversible").should("exist");
    cy.contains("* Notes in this project will be deleted").should("exist");
  });

  it("renders with deleteFromDB=false", () => {
    let props = {
      show: true,
      projectTitle: "test title",
      deleteFromDB: false,
    };
    cy.mount(DeleteDialog, { props });
    cy.contains("* This operation is not reversible").should("not.exist");
    cy.contains("* Notes in this project will be deleted").should("not.exist");
  });

  it("cancel", () => {
    let props = {
      show: true,
      projectTitle: "test title",
      deleteFromDB: true,
    };
    const vue = cy.mount(DeleteDialog, { props });
    cy.dataCy("btn-cancel").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
    });
  });

  it("confirm", () => {
    let props = {
      show: true,
      projectTitle: "test title",
      deleteFromDB: true,
    };
    const vue = cy.mount(DeleteDialog, { props });
    cy.dataCy("btn-confirm").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.eql([[false]]);
      expect(wrapper.emitted("confirm")).to.have.length(1);
    });
  });
});
