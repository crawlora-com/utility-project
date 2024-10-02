import puppeteer from "puppeteer"

export default async function (args = {}){
    // code run

    const desktop = await puppeteer.launch({ headless: false })

    // code 

    const page = await desktop.newPage();

    await page.goto("https://crawlora.com")

    await desktop.close()



}