import { createRouter, createWebHashHistory } from 'vue-router'
import Projects from './views/Projects.vue'
import Design from './views/Design.vue'
import Compare from './views/Compare.vue'
import Review from './views/Review.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', component: Projects, name: 'projects' },
    { path: '/design', component: Design, name: 'design' },
    { path: '/compare', component: Compare, name: 'compare' },
    { path: '/review', component: Review, name: 'review' }
  ]
})
