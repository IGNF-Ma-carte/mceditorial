// import './localhostapi' ;

import charte from  'mcutils/charte/macarte';
import serviceURL, { getDocumentationURL } from 'mcutils/api/serviceURL';

import loadArticles from './loadArticles';
import './scss/global.scss';

charte.setApp('faq',  'Ma carte');
document.querySelector('ul.breadcrumb li a.aide').href = serviceURL['doc'];

// Get page
const pages = {
  faq: '/aide/faq',
  tuto: '/aide/tuto',
  version: '/aide/note-de-versions',
}
let page = 'faq';
for (let p in pages) {
  if (new RegExp(pages[p]).test(window.location.href)) {
    page = p
  }
}

// Update breadscrum
document.querySelector('ul.breadcrumb li a.faq').href = getDocumentationURL(page);
document.querySelector('ul.breadcrumb li a.faq').textContent = page;
document.querySelector('ul.breadcrumb li.category').style.display = page === 'faq' ? '' : 'none';

// Load article page
loadArticles(page);
