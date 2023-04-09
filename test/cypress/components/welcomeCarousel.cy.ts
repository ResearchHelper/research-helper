import WelcomeCarousel from "src/components/WelcomeCarousel.vue";

describe("WelcomeCarousel.vue", () => {
  beforeEach(() => {
    cy.mount(WelcomeCarousel, { props: { modelValue: true } });
  });
  it("title", () => {
    cy.get("h2").should("contain", "Welcome to Research Helper");
  });
});

// Workaround for Cypress AE + TS + Vite
// See: https://github.com/quasarframework/quasar-testing/issues/262#issuecomment-1154127497
export {};
