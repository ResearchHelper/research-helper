import RightMenu from "./RightMenu.vue";

describe("<RightMenu />", () => {
  it("renders", function () {
    cy.mount(RightMenu);

    cy.dataCy("tab-meta-info").should("be.visible");
    cy.dataCy("tab-toc").should("be.visible");
    cy.dataCy("tab-annot-list").should("be.visible");
  });
});
