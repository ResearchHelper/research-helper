import AnnotationList from "./AnnotationList.vue";

describe("<AnnotationList />", () => {
  beforeEach(() => {
    cy.fixture("annots.json").as("annots");
  });
  it("renders", function () {
    cy.mount(AnnotationList, {
      props: {
        selectedAnnotId: this.annots[0]._id,
        annots: this.annots,
      },
    });

    cy.get('[data-cy*="annot-card"]').should("have.length", this.annots.length);
  });
});
