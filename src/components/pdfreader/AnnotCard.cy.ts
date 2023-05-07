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

    cy.dataCy("annot-content").should("have.text", "∫f\\int f∫f");
  });

  it("open menu", function () {
    cy.mount(AnnotCard, {
      props: {
        annot: this.annots[0],
      },
    });

    cy.dataCy("btn-menu").click();
    cy.dataCy("annot-menu");
  });
});
