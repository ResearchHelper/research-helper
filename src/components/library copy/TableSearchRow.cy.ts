import TableSearchRow from "./TableSearchRow.vue";

describe("<TableSearchRow />", () => {
  it("renders", () => {
    cy.mount(TableSearchRow, { props: { text: "test-text", width: 500 } });
    cy.dataCy("text").should("have.text", "test-text");
  });
});
