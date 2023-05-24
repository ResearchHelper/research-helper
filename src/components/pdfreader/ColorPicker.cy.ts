import ColorPicker from "./ColorPicker.vue";

describe("<ColorPicker />", () => {
  it("renders", () => {
    cy.mount(ColorPicker);
    cy.dataCy("btn-ffff00");
  });

  it("select color", () => {
    const vue = cy.mount(ColorPicker);
    cy.dataCy("btn-ffff00").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("selected")).to.have.length(1);
    });
  });
});
