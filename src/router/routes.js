const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/IndexPage.vue") }],
  },
  // { path: "/", component: () => import("pages/LibraryPage.vue") },
  // { path: "/", component: () => import("pages/ReaderPage.vue") },
  // { path: "/", component: () => import("pages/NotePage.vue") },
  // { path: "/", component: () => import("pages/SettingPage.vue") },
  // Always leave this as last one,
  // but you can also remove it
  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('pages/ErrorNotFound.vue')
  // }
];

export default routes;
