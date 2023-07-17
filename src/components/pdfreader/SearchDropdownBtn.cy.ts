import SearchDropdownBtn from "./SearchDropdownBtn.vue";

describe("<SearchDropdownBtn />", () => {
  it("renders - default matchesCount", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: -1, total: 0 },
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("search-summary").should("have.text", "phrase not found");
  });
  it("renders - given matchesCount", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: 10, total: 100 },
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("search-summary").should("have.text", "10 of 100 matches");
  });
  it("search - text input", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: 10, total: 100 },
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("input-search").type("physics");
    cy.wait(500); // wait 500ms
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("search")?.slice(-1)).to.eql([
        [
          {
            query: "physics",
            highlightAll: true,
            caseSensitive: false,
            entireWord: false,
          },
        ],
      ]);
    });
  });
  it("search - highlightAll", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: 10, total: 100 },
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("checkbox-highlight-all").click();
    cy.wait(500); // wait 500ms
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("search")?.slice(-1)).to.eql([
        [
          {
            query: "",
            highlightAll: false,
            caseSensitive: false,
            entireWord: false,
          },
        ],
      ]);
    });
  });
  it("search - caseSensitive", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: 10, total: 100 },
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("checkbox-case-sensitive").click();
    cy.wait(500); // wait 500ms
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("search")?.slice(-1)).to.eql([
        [
          {
            query: "",
            highlightAll: true,
            caseSensitive: true,
            entireWord: false,
          },
        ],
      ]);
    });
  });
  it("search - entireWord", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: 10, total: 100 },
      },
    });
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("checkbox-entire-word").click();
    cy.wait(500); // wait 500ms
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("search")?.slice(-1)).to.eql([
        [
          {
            query: "",
            highlightAll: true,
            caseSensitive: false,
            entireWord: true,
          },
        ],
      ]);
    });
  });
  it("changeMatch", () => {
    // see: https://on.cypress.io/mounting-vue
    const vue = cy.mount(SearchDropdownBtn, {
      props: {
        matchesCount: { current: 10, total: 100 },
      },
    });
    // don't wait more than 400ms
    // otherwise it will emit search event
    cy.dataCy("btn-dropdown").click();
    cy.dataCy("btn-change-match-prev").click();
    cy.dataCy("btn-change-match-next").click();
    vue.then(({ wrapper }) => {
      // emit once when menu opens
      // emit another time after typed
      expect(wrapper.emitted("changeMatch")).to.eql([[-1], [1]]);
    });
  });
});
