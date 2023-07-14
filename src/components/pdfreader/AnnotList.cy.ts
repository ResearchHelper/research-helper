import AnnotList from "./AnnotList.vue";

describe("<AnnotList />", () => {
  beforeEach(() => {
    cy.fixture("annots.json").as("annots");
  });
  it("renders", function () {
    cy.mount(AnnotList, {
      props: {
        selectedAnnotId: this.annots[0]._id,
        annots: this.annots,
      },
    });

    cy.get('[data-cy*="annot-card"]').should("have.length", this.annots.length);
  });
});
