import puppeteer from 'puppeteer';

let instance = null;

const createBrowser = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    instance = page;
}

const getInstance = async () => {
    if (instance === null)
        await createBrowser();
    await instance.goto('about:blank');
    return instance;
}

module.exports = {
    getInstance
}