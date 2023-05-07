import WelcomeCarousel from "./WelcomeCarousel.vue";

describe("<WelcomeCarousel />", () => {
  beforeEach(() => {
    cy.mount(WelcomeCarousel, { props: { modelValue: true } });
  });
  it("renders", () => {
    cy.dataCy("title").should("contain.text", "Welcome to Research Helper");
  });

  it("chinese", () => {
    cy.dataCy("language-select").select("中文 (zh_CN)");
    cy.dataCy("title").should("contain.text", "欢迎使用研究小助手");
  });
});
