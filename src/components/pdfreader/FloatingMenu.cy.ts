import FloatingMenu from "./FloatingMenu.vue";

describe("<FloatingMenu />", () => {
  it("renders", () => {
    cy.mount(FloatingMenu);
    cy.get('[data-cy="btn-#ffff00"]');
    cy.get('[data-cy="btn-copy"]');
  });

  it("select color", () => {
    const onHighlightTextSpy = cy.spy().as("onHighlightTextSpy");
    cy.mount(FloatingMenu, { props: { onHighlightText: onHighlightTextSpy } });
    cy.get('[data-cy="btn-#ffff00"]').click();
    cy.get("@onHighlightTextSpy").should("have.been.calledWith", "#ffff00");
  });
});
