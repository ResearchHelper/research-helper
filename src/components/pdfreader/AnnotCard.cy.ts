import AnnotCard from "./AnnotCard.vue";

describe("<AnnotCard />", () => {
  beforeEach(() => {
    cy.fixture("annots.json").as("annots");
  });

  it("renders", function () {
    cy.mount(AnnotCard, {
      props: {
        annot: this.annots[0],
      },
    });

    cy.get('[data-cy="annot-content"]').should("have.text", "∫f\\int f∫f");
  });

  it("open menu", function () {
    cy.mount(AnnotCard, {
      props: {
        annot: this.annots[0],
      },
    });

    cy.get('[data-cy="btn-menu"]').click();

    cy.get('[data-cy="annot-menu"]');
  });
});
