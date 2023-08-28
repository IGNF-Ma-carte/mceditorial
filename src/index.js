import './mcversion'
import charte from  'mcutils/charte/macarte';
import 'mcutils/font/loadFonts';
import serviceURL, { getDocumentationURL } from 'mcutils/api/serviceURL';
import ol_ext_element from 'ol-ext/util/element'

import loadArticles from './loadArticles';

import './scss/global.scss';

document.querySelector('article.faq a').href = getDocumentationURL('faq')
document.querySelector('article.tuto a').href = getDocumentationURL('tuto')
charte.setApp('doc',  'Ma carte');

// Get page as param
const urlParams = new URLSearchParams(window.location.search);
let page = urlParams.get('page') || '';
// Search page in url
const pages = {
  faq: '/aide/faq',
  tuto: '/aide/tuto',
  version: '/aide/notes-de-version',
}
for (let p in pages) {
  if (new RegExp(pages[p]).test(window.location.href)) {
    page = p
  }
}

if (page && pages[page]) {
  document.body.dataset.article = page;

  // Update breadscrum
  const help = document.querySelector('ul.breadcrumb li.help')
  const helpTxt = help.innerText;
  help.innerHTML = '';
  ol_ext_element.create('A', {
    text: helpTxt,
    href: serviceURL['doc'],
    parent: help
  })

  const ul = document.querySelector('ul.breadcrumb')
  ol_ext_element.create('LI', {
    html: ol_ext_element.create('A', {
      html: page,
      className: 'faq',
      href: getDocumentationURL(page)
    }),
    parent: ul
  })
  if (page === 'faq') {
    ol_ext_element.create('LI', {
      className: 'category',
      html: '<a></a>',
      parent: ul
    })
  }
  ol_ext_element.create('LI', {
    className: 'article',
    parent: ul
  })

  // Load article page
  loadArticles(page);
} else {
  document.body.dataset.article = 'none';
}
