import axios from 'axios';
import fs from 'fs';
import cheerio from 'cheerio';
import download from 'download';

import XLSX from '../utils/XLSXConverter';
import sleeper from '../utils/sleeper';
import { config } from '../config';

const shop = config.shop;

let books = [];
let urls = [];
let pdfURLs = [];

let pages = {
    books: []
}

let run = async () => {

    let response;

    response = await fetchPages();

    if (response === 'success')
        return response;

    // let count = 0;
    // for (let i = 1; i < 2; i++) {
    //     let dynURL = url + i;
    //     await fetchBooksURLs(dynURL);
    //
    //     console.log(`Fetched Page No. ${i}, [${urls.length}]`);
    //
    //     count++;
    //     /*if (count % 50 === 0) {
    //         await sleeper.sleep(180000);
    //     }*/
    // }
    // console.log(`${urls.length} URLs Fetched Successfully`);
    //
    // await fetchBooksCoversAndPDFs();
    // console.log('Covers and PDFs Fetched Successfully')
    //
    // // console.log('Exporting Data to XLSX File')
    // // XLSX.convert(books);
    // console.log('DONE')
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