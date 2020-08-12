import axios from 'axios';
import fs from 'fs';
import cheerio from 'cheerio';

import { config } from '../config';
import browserLauncher from '../utils/browserLauncher';
import { isLoadable, load } from '../utils/jsonLoader';

const shop = config.shop;

let pages = {
    books: []
}

let books = {
    count : null,
    table: []
};

let run = async () => {

    let response;
    // response = await fetchPages();
    response = await fetch();
    return response;
}

const fetchPages = async () => {

    try {
        for (let i = 1; i < 244; i++) {
            let url = `${shop.url}${shop.subUrl}?ps=${shop.attributes.ps}&page=${i}&st=${shop.attributes.st}&categoryid=${shop.attributes.categoryid}&lang=${shop.attributes.lang}`;

            // fetch page in json form
            console.log(`log: fetching page no. ${i}`);
            let thisPage = await axios.get(url);

            // let thisPage = await axios.get(url);
            for (const book of thisPage.data.Data) {
                /**
                 * e.g. :
                 * Title: 'IELTS Cambridge 15 General +CD',
                 * SeoUrlTitle: 'ielts-cambridge-15-general',
                 * Summary: null,
                 * Id: 167658,
                 * Image: '/uploads/product/ielts-cambridge-15-general.jpg',
                 * Price: 30000.00,
                 * Url: '/fa/product/167658/ielts-cambridge-15-general',
                 * Currency: 'تومان'
                 *
                 */
                let thisBook = {
                    Id: book.Id,
                    Title: book.Title,
                    SeoUrlTitle: book.SeoUrlTitle,
                    Price: book.Price,
                    Currency: book.Currency,
                    Summary: book.Summary,
                    Url: book.Url,
                    Image: book.Image
                }

                pages.books.push(thisBook);
                // console.log(`Log: ${thisBook.Id} pushed`)
            }
        }

        let json = JSON.stringify(pages);
        await fs.writeFile('data.json', json, 'utf8', res => res ? console.log('An error occurred') : console.error('File Created Successfully'));

        return 'success';
    } catch (e) {
        console.error(`Error: ${e}`);
    }
}

const fetch = async () => {

    let data = await load('data.json');
    if (data)
        console.log('Loading raw data...');

    try {

        let counter = 0;
        let head = -1;

        if (await isLoadable('assets/JSON/organized-data.json')) {
            console.log(`Loading previously created data...`);
            books = await load('assets/JSON/organized-data.json');
            head = parseInt(books.count);
        }

        for (const book of data.books) {

            if (counter < head) {
                counter++;
                continue;
            } else
                counter++;

            let bookJson = await fetchData(book);
            books.table.push(bookJson);

            if (counter % 20 === 0) {
                books.count = counter;
                let json = JSON.stringify(books);
                await fs.writeFile(`assets/JSON/organized-data.json`, json, 'utf8',
                        err => err ? console.error(err) :
                            console.log(`Message: Data Exported, ${(new Date()).toString()} -> Book Count: ${counter}`) );
            }
        }
    } catch (e) {
        console.error(`Error: ${e}`);
    }
}

const fetchData = async (book) => {

    let bookUrl = `${shop.url}${book.Url}`;

    const page = await browserLauncher.getInstance();
    await page.goto(bookUrl, {
        waitUntil: 'networkidle2',
        timeout: 0
    }, err => {
        console.log(`Puppeteer error: ${err}`)
    });

    const body = await page.evaluate(() => {
        return document.querySelector('body').outerHTML;
    });

    let thisBook = {
        id: book.Id,
        title: book.Title,
        price: book.Price,
        currency: book.Currency,
        seoTitle: book.SeoUrlTitle,
        url: {
            book: bookUrl,
            pdf: null,
            cover: null
        }
    }

    // set cover url
    const coverRelativeUrl = book.Image;
    if (coverRelativeUrl) {
        const absUrl = `${shop.url}${coverRelativeUrl}`;
        thisBook.url.cover = absUrl;
    }

    console.log(`fetching: ${bookUrl}`);
    const $ = cheerio.load(body, {
        decodeEntities: false
    })

    // fetch pdf url
    const pdfRelativeUrl = $('._widget').find('a[download]').attr('href').toString().trim();
    if (pdfRelativeUrl) {
        const absUrl = `${shop.url}${pdfRelativeUrl}`
        thisBook.url.pdf = absUrl;
    }

    // fetch tags
    let tags = [];
    let tagSkipper = 2;
    $('.breadcrumbs').children().each((index, element) => {
        if (tagSkipper === 0) {
            let tag = $(element).find('a').children('span').text().toString().trim();

            if (tag !== book.Title)
                tags.push(tag);
        }
        if (tagSkipper > 0)
            tagSkipper--;
    });
    $('div[data-tagcloud] > ul > li').each((index, element) => {
        let tag = $(element).find('a').children('span').text().toString().trim();
        tags.push(tag);
    });
    thisBook.tags = tags;

    // fetch details
    let details = [];
    $('.p-details').children().each((index, element) => {
        // const tagName = $(element)[0].name.toString().trim();
        const content = $(element).text().toString().trim();
        details.push(content);
    });
    thisBook.about = details;

    // fetch properties
    let attributes = {};
    let mode;
    $('div[id="featureview"]').find('div > ul').each((index, element) => {
        $(element).children('li').each((index2, element2) => {
            if ($(element2).find('h5').children('span').text().toString().trim() !== undefined &&
                $(element2).find('h5').children('span').text().toString().trim() !== '') {
                mode = $(element2).find('h5').children('span').text().toString().trim();
                if (attributes[mode] === undefined)
                    attributes[mode] = {};
            } else {
                let attribute = $(element2).find('._title').children('span').text().toString().trim();
                let value = $(element2).find('._value').children('p').text().toString().trim();
                attributes[mode][attribute] = value;
            }
        });
    });
    thisBook.attributes = attributes;

    return thisBook;
}

const fetchCover = async (coverUrl, filename) => {
    console.log(`fetching cover: ${coverUrl}`);
}

// const fetchBooksURLs = async (url) => {
//
//     const page = await axios.get(url);
//
//     const $ = cheerio.load(page.data, {
//         decodeEntities: false,
//     });
//
//     $('.productareagm').each((index, product) => {
//
//         let url = $(product).children('a').attr('href');
//         let name = $(product).find($('.pdname')).children('h3').text();
//
//         let book = {
//             url: url,
//             name: name
//         }
//
//         urls.push(book);
//     })
// }

// const fetchBooksCoversAndPDFs = async () => {
//
//     try {
//         let count = 0;
//
//         for (const url of urls) {
//
//             // let book = {
//             //     ISBN: null,
//             //     NAME: null,
//             //     PATH: null,
//             // }
//
//             let response = await axios.get(url.url);
//
//             const $ = cheerio.load(response.data, {
//                 decodeEntities: false
//             });
//
//             // book.ISBN = $('.productratearea').find('.sku').text();
//
//             //custom expresion to extract extension
//             const exp = /(?:\.([^.]+))?$/;
//
//             //fetch cover
//             // let coverURL = $('.productpics').children('img').attr('src');
//             //extract file extension
//             // const coverExt = exp.exec(coverURL)[1];
//             // download(coverURL).pipe(fs.createWriteStream(`assets/covers/${url.name}.${coverExt}`));
//
//             let validURL = null;
//             $('.woocommerce-Tabs-panel').children('p').each(async (index, element) => {
//                 let pdfURL = $(element).children('a').attr('href');
//                 const pdfExt = exp.exec(pdfURL)[1];
//                 if (pdfExt === 'zip' || pdfExt === 'rar' || pdfExt === 'pdf') {
//                     validURL = pdfURL;
//                     // await download(validURL).pipe(fs.createWriteStream(`assets/PDFs/${url.name}.${pdfExt}`));
//                 }
//             })
//
//             if (validURL !== null)
//                 pdfURLs.push(validURL);
//
//             // book.NAME = url.name;
//             // book.PATH = `storage/books/${url.name}.${coverExt}`;
//
//             // books.push(book);
//
//             count++;
//             console.log(`Fetched No. ${count}, URL: ${validURL}`);
//             if (count % 500 === 0) {
//                 await sleeper.sleep(180000);
//             }
//         }
//     } catch (e) {
//         console.error(e);
//     }
//
//     await Promise.all(pdfURLs.map(url => download(url, 'assets/PDFs')));
// }

// let crawl = async (url) => {
//
//     let set = []
//
//     const page = await axios.get(url);
//
//     const $ = cheerio.load(page.data, {
//         decodeEntities: false,
//     });
//
//     $('.productareagm').each((index, product) => {
//
//         let url = $(product).children('a').attr('href');
//         let formerPrice = $(product).find($('.pdprice')).find('div > del').children('span').text();
//         let latterPrice = $(product).find($('.pdprice')).find('div > ins').children('span').text();
//
//         let book = {
//             url: url,
//             formerPrice: formerPrice,
//             latterPrice: latterPrice,
//         }
//
//         set.push(book);
//     })
//
//     for (const book of set) {
//         let responsePerBook = await axios.get(book.url);
//
//         const $ = cheerio.load(responsePerBook.data, {
//             decodeEntities: false
//         });
//
//         let isbn = $('.productratearea').find('.sku').text();
//         book.ISBN = isbn;
//
//         $('.additionalproarea').find('.woocommerce-product-attributes-item__label').each((index, label) => {
//             let key = $(label).text().toString().replace('\n', '');
//             let value = $(label).next().text().toString().replace('\n', '');
//             book[key] = value;
//         })
//
//         //tags
//         let temp = [];
//         $('.posted_in').children('a').each((index, tag) => {
//             temp.push($(tag).text());
//         })
//
//         let tags = '';
//         for (const e of temp) {
//             tags = tags.concat(e + ', ');
//         }
//         book.tags = tags;
//
//         delete book.url;
//
//         books.push(book);
//     }
// }

module.exports = {
    run
}