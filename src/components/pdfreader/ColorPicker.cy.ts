import ColorPicker from "./ColorPicker.vue";

describe("<ColorPicker />", () => {
  it("select color", () => {
    const onSelectedSpy = cy.spy().as("onSelectedSpy");
    cy.mount(ColorPicker, { props: { onSelected: onSelectedSpy } });
    cy.get('[data-cy="btn-#ffff00"]').click();
    cy.get("@onSelectedSpy").should("have.been.calledWith", "#ffff00");
  });
});
