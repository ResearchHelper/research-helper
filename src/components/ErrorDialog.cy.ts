import ErrorDialog from "./ErrorDialog.vue";

describe("<ErrorDialog />", () => {
  it("renders", () => {
    let errMsg = "test error";
    let error = new Error(errMsg);
    cy.mount(ErrorDialog, { props: { show: true, error: error } });
    cy.get('[data-cy="error-msg"]').should("have.text", errMsg);
  });

  it("close", () => {
    const onUpdateShowSpy = cy.spy().as("onUpdateShowSpy");
    let errMsg = "test error";
    let error = new Error(errMsg);
    cy.mount(ErrorDialog, {
      props: {
        show: true,
        error: error,
        "onUpdate:show": onUpdateShowSpy,
      },
    });
    cy.get('[data-cy="btn-ok"]').click();
    cy.get("@onUpdateShowSpy").should("have.been.calledOnceWith", false);
  });
});
