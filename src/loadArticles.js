import api from  'mcutils/api/api';
import ol_ext_element from 'ol-ext/util/element';
import md2html from 'mcutils/md/md2html';
import FlashMessage from 'mcutils/dialog/FlashMessage';
import 'mcutils/font/loadFonts';
import { getMediaURL, encodeTitleURL, getDocumentationURL } from 'mcutils/api/serviceURL';

const contentDiv = document.querySelector('[data-role="content"]');

let page;
let categories = [];
let currentCategory;
let currentArticleId;

let firstArticleId = null; //id du 1er article, si pas de categorie ni d'article défini dans l'url
let firstArticleCategoryId = null; //id du 1er article de la categorie, si non défini dans l'url
let currentArticleExists = true;

const articlesArray = {};

let delayTout;
ol_ext_element.addListener(contentDiv.querySelector('.search input'), ['input', 'keyup'],  e => {
    clearTimeout(delayTout)
    delayTout = setTimeout(() => searchArticle(e.target.value), 300)
})

/**
 * 
 * @param {string} category : indique quelle page de l'éditorial est appelée
 *      @param {string} title : Titre à afficher dans le H1
 *      @param {string} category : Nom de la category (dans l'API)
 *      @param {regex} regex : Expression régulière des catégories pour lesquelles on télécharge les articles
 * @param {regex} categoryReg : critère des catégories à afficher
 */
function loadArticles(displayedPage/*category, articleId*/){
    page = displayedPage;

    function afterCategories(page){
        getParamsFromURL(page);
        displayCategories(categories);
    }
    getCategories(page, afterCategories);
}


function getCategories(page, callback){
    api.getArticleCategories( (cats) => {
        for(let i in cats){
            const cat = cats[i];

            if(page == 'tuto' && cat.key == 'tuto'){
                categories.push(cat);
            }
            if(page == 'version' && cat.key == 'version'){
                categories.push(cat);
            }

            if(page == 'faq' && /^faq_/.test(cat.key)) {
                categories.push(Object.assign(cat));
            }
        }
        callback(arguments[1])
    });
}

// récupère la categorie etl'id de l'article actuel d'apres l'url
function getParamsFromURL() {
    
    // version url /aide?category=<category>&article=<titre>_<id>
    const queryString = window.location.search;

    const urlParams = new URLSearchParams(queryString);
    let articleName = urlParams.get('article') || ''; 
    let categoryName = urlParams.get('categorie') || '';

    //version /aide/faq/<category>/<article>
    // si tuto : /aide/tuto/<article>
    // si version : /aide/version/<article>
    if(!categoryName){
        const urlAsArray = window.location.pathname.split('/');
        if(page == 'faq'){
            articleName = urlAsArray[4] || '';
            categoryName = urlAsArray[3] || '';
        }
        if(page == 'tuto'){
            articleName = urlAsArray[3];
            categoryName = 'tuto';
        }
        if(page == 'version'){
            articleName = urlAsArray[3];
            categoryName = 'version';
        }
    }

    // on demande une categorie inexistante
    let categoryExists = false
    for(let i in categories){
        const cat = categories[i];
        if(cat.key == categoryName){
            currentCategory = cat;
            categoryExists = true;
            break;
        }
    }
    if(!categoryExists){
        currentCategory = categories[0];
    }

    if(articleName){
        currentArticleId = parseInt(articleName.split('_').pop());
        currentArticleExists = false;
    }
}

// lorsqu'on se déplace dans l'historique
window.addEventListener('popstate', (e) => {
    const article = getArticleFromURL();
    displayArticle(article.articleId);
});


// affiche les catégories et les titres des articles associés
function displayCategories(categories){
    const tempCategories = categories.slice();
    const ul = contentDiv.querySelector('ul.list');
    nextCategory();
    
    //rendre les appels getArticles synchrones
    function nextCategory(){
        const category = tempCategories.shift();

        // tous les articles des categories sont téléchargés
        if(!category){
            if(currentArticleExists && currentArticleId ){
                displayArticle(currentArticleId);
            }else{
                new FlashMessage({
                    type: 'error',
                    message: "L'article demandé n'existe pas"
                });
                
                if(firstArticleCategoryId){
                    displayArticle(firstArticleCategoryId);
                }else{
                    displayArticle(firstArticleId);
                }
            }
            return;
        }

        const li = ol_ext_element.create('LI', {
            parent: ul,
            html: category.value,
            click: (e) => {
                e.stopPropagation();
                showCategory(category.key);
            }
        });

        //les articles de la categorie sont dans le ul
        const ulArticles = ol_ext_element.create('UL', {
            parent: li,
            'data-category': category.key,
        });

        api.getArticles(category.key, (articles) => { 
            articles.forEach( (article) => {
                articlesArray[article.id] = article;
                if(!firstArticleId){
                    firstArticleId = article.id;
                }
                if(currentCategory && currentCategory.key == category.key && !firstArticleCategoryId){
                    firstArticleCategoryId = article.id;
                }
                if(currentCategory && currentCategory.key == category.key && !currentArticleId){
                    currentArticleId = article.id;
                }
                if(currentArticleId == article.id){
                    currentArticleExists = true;
                }
                
                const liArticle = ol_ext_element.create('LI', {
                    parent: ulArticles,
                    'data-article-id': article.id,
                    click: (e) => {
                        e.stopPropagation();
                        window.history.pushState({}, article.title, getArticleUrlTitle(article));
                        displayArticle(article.id);
                    }
                });
                if(article.img_url){
                    ol_ext_element.create('IMG', {
                        parent: liArticle,
                        src: getMediaURL(article.img_url)
                    });
                }

                ol_ext_element.create('SPAN', {
                    html: article.title.replace(/ ([:;?!])/g, '&nbsp;$1'),
                    parent: liArticle,
                });
            });

            nextCategory();
        });
    };
}

function displayArticle(articleId){
    window.scrollTo(0,Math.min(window.scrollY,100));
    const contentArticleDiv =  contentDiv.querySelector('.content');

    if(!articleId){
        ol_ext_element.create('text', {
            parent: contentArticleDiv,
            text: "Aucun article trouvé"
        });
        return;
    }

    const liArticle = document.querySelector('li[data-article-id="'+articleId+'"]');
    const article = articlesArray[articleId];

    if(article.category != currentCategory.key){
        for(let i in categories){
            const cat = categories[i];
            if(cat.key == article.category){
                currentCategory = cat;
                break;
            }
        }
    }
    if(page == 'faq'){
        document.querySelector('.breadcrumb .category a').innerText = currentCategory.value; //(article.category);
        document.querySelector('.breadcrumb .category a').href = getDocumentationURL('faq', currentCategory.key); //(article.category);
    }
    document.querySelector('.breadcrumb .article').innerText = article.title;

    showCategory(article.category);

    document.querySelectorAll('ul[data-category] li').forEach( (li2) => {
        li2.classList.remove('colored');
    })
    liArticle.classList.add('colored');

    contentArticleDiv.innerHTML = '';

    ol_ext_element.create('H2', {
        html: article.title,
        parent: contentArticleDiv,
    });
    ol_ext_element.create('DIV', {
        html: '<span><i class="fi-calendar"></i> Mis à jour le ' + new Date(article.updated_at).toLocaleDateString('fr', {
            day: "numeric",
            month: 'long',
            year: "numeric",
        }) + "</span>",
        parent: contentArticleDiv,
        className :'gray',
    });

    const title = getArticleUrlTitle(article);
    const linkDiv = ol_ext_element.create('DIV', {
        html: '<i class="fi-location"></i> Url permanente : ',
        className :'gray',
        parent: contentArticleDiv,
    });
    ol_ext_element.create('A', {
        html: title,
        href: title,
        parent: linkDiv,
    });

    ol_ext_element.create('DIV', {
        // html: md2html(article.content, undefined, { shiftTitle: 2, edugeo: isEdugeo }),
        className: 'article',
        html: md2html(article.content, undefined, { shiftTitle: 2, edugeo: false }),
        parent: contentArticleDiv,
    });
}

function showCategory(category){
    contentDiv.querySelectorAll('[data-category]').forEach( (ul) => {
        ul.classList.add('hide');
    });
    contentDiv.querySelector('[data-category="'+category+'"]').classList.remove('hide');
}

function getArticleUrlTitle(article){
    const title = encodeTitleURL(article.title);
    const linkText = getDocumentationURL(page, currentCategory.key, title + '_' + article.id);

    return linkText;
}

/* Search an article */
function searchArticle(text) {
    const rex = new RegExp(text || '.*', 'i');
    Object.keys(articlesArray).forEach(k => {
        const a = articlesArray[k];
        if (!a.searchStr) a.searchStr = a.title + ' ' + md2html.text(a.content);
        contentDiv.querySelector('[data-article-id="'+a.id+'"]').setAttribute('aria-hidden', !rex.test(a.searchStr))
    })
    contentDiv.querySelectorAll('#articles > ul > li').forEach(li => {
        const hide = !li.querySelector('[aria-hidden="false"]')
        li.setAttribute('aria-hidden', hide);
        if (!hide) li.querySelector('ul').classList.remove('hide')
    })
}

export { getParamsFromURL }
export default loadArticles;