import ErrorDialog from "./ErrorDialog.vue";

describe("<ErrorDialog />", () => {
  it("renders", () => {
    let errMsg = "test error";
    let error = new Error(errMsg);
    cy.mount(ErrorDialog, { props: { show: true, error: error } });
    cy.dataCy("error-msg").should("have.text", errMsg);
  });

  it("close", () => {
    let errMsg = "test error";
    let error = new Error(errMsg);
    const vue = cy.mount(ErrorDialog, {
      props: {
        show: true,
        error: error,
      },
    });
    cy.dataCy("btn-ok").click();
    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("update:show")).to.have.length(1);
    });
  });
});
