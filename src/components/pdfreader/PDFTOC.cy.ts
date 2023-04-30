import PDFTOC from "./PDFTOC.vue";

describe("<PDFTOC />", () => {
  beforeEach(() => {
    cy.fixture("outline.json").as("outline");
  });

  it("renders", function () {
    cy.mount(PDFTOC, {
      props: { outline: this.outline },
    });

    cy.get(
      ".q-tree > :nth-child(1) > :nth-child(1) > .q-tree__node-header-content > .ellipsis"
    ).should("have.text", this.outline[0].label);
  });

  it("clickTOC", function () {
    const onClickTOCSpy = cy.spy().as("onClickTOCSpy");

    cy.mount(PDFTOC, {
      props: {
        outline: this.outline,
        onClickTOC: onClickTOCSpy,
      },
    });

    cy.get(
      ".q-tree > :nth-child(1) > :nth-child(1) > .q-tree__node-header-content > .ellipsis"
    ).click();

    cy.get("@onClickTOCSpy").should("have.been.calledWith", this.outline[0]);
  });
});
