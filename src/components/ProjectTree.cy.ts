import ProjectTree from './ProjectTree.vue'

describe('<ProjectTree />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(ProjectTree)
  })
})