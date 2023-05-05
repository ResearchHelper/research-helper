import WelcomeCarousel from "./WelcomeCarousel.vue";

describe("<WelcomeCarousel />", () => {
  beforeEach(() => {
    cy.mount(WelcomeCarousel, { props: { modelValue: true } });
  });
  it("renders", () => {
    cy.get('[data-cy="title"]').should(
      "contain.text",
      "Welcome to Research Helper"
    );
  });

  it("chinese", () => {
    cy.get('[data-cy="language-select"]').select("中文 (zh_CN)");
    cy.get('[data-cy="title"]').should("contain.text", "欢迎使用研究小助手");
  });
});
