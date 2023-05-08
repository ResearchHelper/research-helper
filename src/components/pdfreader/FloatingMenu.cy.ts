import FloatingMenu from "./FloatingMenu.vue";

describe("<FloatingMenu />", () => {
  it("renders", () => {
    cy.mount(FloatingMenu);
    cy.dataCy("btn-ffff00");
    cy.dataCy("btn-copy");
  });

  it("select color", () => {
    const vue = cy.mount(FloatingMenu);
    cy.dataCy("btn-ffff00").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("highlightText")).to.have.length(1);
    });
  });
});
