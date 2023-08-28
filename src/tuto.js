// import './localhostapi' ;

import charte from  'mcutils/charte/macarte';
import serviceURL, { getDocumentationURL } from 'mcutils/api/serviceURL';

import loadArticles from './loadArticles';
import './scss/global.scss';

charte.setApp('faq',  'Ma carte');
document.querySelector('ul.breadcrumb li a.aide').href = serviceURL['doc'];
document.querySelector('ul.breadcrumb li a.tuto').href = getDocumentationURL('tuto');

loadArticles('tuto');