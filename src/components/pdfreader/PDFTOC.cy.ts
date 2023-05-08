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
    const vue = cy.mount(PDFTOC, {
      props: { outline: this.outline },
    });

    cy.get(
      ".q-tree > :nth-child(1) > :nth-child(1) > .q-tree__node-header-content > .ellipsis"
    ).click();

    vue.then(({ wrapper }) => {
      expect(wrapper.emitted("clickTOC")).to.have.length(1);
    });
  });
});
