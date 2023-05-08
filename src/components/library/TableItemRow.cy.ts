import { Note } from "src/backend/database";
import TableItemRow from "./TableItemRow.vue";
import { useStateStore } from "src/stores/appState";

describe("<TableItemRow />", () => {
  beforeEach(() => {
    const stateStore = useStateStore();
    cy.wrap(stateStore).as("stateStore");
  });
  it("renders", () => {
    let item = {
      _id: "testId",
      label: "test node",
      dataType: "note",
    } as Note;
    cy.mount(TableItemRow, { props: { item } });
    cy.dataCy("content").should("contain.text", item.label);
    cy.dataCy("content").rightclick();
    cy.dataCy("menu").should("exist");
  });

  it("open note", () => {
    let item = {
      _id: "testId",
      label: "test node",
      dataType: "note",
    } as Note;
    cy.mount(TableItemRow, { props: { item } });
    cy.dataCy("content").rightclick();
    cy.dataCy("btn-open-item").click();
    // TODO: how to deal with store?
    cy.get("@stateStore").then((store) => {
      console.log(store);
    });
    // expect(window.stateStore.openItemId).to.eq(item._id);
  });
});
