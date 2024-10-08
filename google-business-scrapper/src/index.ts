import { browser, wait } from "crawlora";
import { ElementHandle, Page } from "puppeteer";


async function scrapeBusinessDetails(page: Page, allBusinessData: any[], query: string, debug: debug.Debugger) {

  const selector = ".fontTitleLarge"

  debug(selector)

  await page.waitForSelector(selector);


  const div = 'div[aria-label="'+ query +'"]'


  debug(div)

  await page.$(div)


  const allTheAvailableElement = "div.Nv2PK.tH5CWc.THOPZb";
  debug(allTheAvailableElement)
  const allTheData = await page.$$(allTheAvailableElement)


  const data = await page.evaluate(() => {
    const results: any[] = [];
    const elements = document.querySelectorAll('div.Nv2PK.tH5CWc.THOPZb');

    elements.forEach((element) => {
        const name = (element.querySelector('a[aria-label]') as HTMLAnchorElement)?.getAttribute('aria-label');
        const link = (element.querySelector('a[aria-label]') as HTMLAnchorElement)?.href;
        const rating = (element.querySelector('span[role="img"] span.MW4etd') as HTMLElement)?.textContent;
        const reviewCount = (element.querySelector('span.UY7F9') as HTMLElement)?.textContent;
        const status = (element.querySelector('span.fontBodyMedium') as HTMLElement)?.textContent;

         // Generic functions to extract type and address
         const extractType = () => {
          const typeElement = element.querySelector('span');
          return typeElement ? typeElement.textContent?.trim() : null;
      };

      const extractAddress = () => {
          const addressElements = element.querySelectorAll('span');
          // Combine text content of all spans to form the address
          const addressText = Array.from(addressElements).map(span => span.textContent?.trim()).join(' ');
          return addressText.includes("·") ? addressText.split('·')[1].trim() : null; // Adjust logic as per structure
      };

      const type = extractType();
      const address = extractAddress();

        results.push({ name, link, rating, reviewCount, type, address, status });
    });


    return results;
});

console.log(data)

allBusinessData = data



}

type NonNegativeInteger<T extends number> = number extends T ? never : `${T}` extends `-${string}` | `${string}.${string}` ? never : T;

export async function autoScroll(page: Page, wait: <N extends number>(sec: NonNegativeInteger<N>) => Promise<void>){
  let currentElement = 0;

  const scrollElements = '.w6VYqd'
  while (true) {
    let elementsLength = await page.evaluate((scrollElements) => {
      return document.querySelectorAll(scrollElements).length;
    }, scrollElements);
    for (; currentElement < elementsLength; currentElement++) {
      await wait(2);
      await page.evaluate(
        (currentElement, scrollElements) => {
          document.querySelectorAll(scrollElements)[currentElement].scrollIntoView();
        },
        currentElement,
        scrollElements
      );
    }
    await wait(5);
    let newElementsLength = await page.evaluate((scrollElements) => {
      return document.querySelectorAll(scrollElements).length;
    }, scrollElements);
    if (newElementsLength === elementsLength) break;
  }
}

export default async function GetGoogleBusinessData({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const formedData = searchQuery
    .trim()
    .split("\n")
    .map((v) => v.trim());

  await browser(
    async ({ page, wait, debug }) => {
      try {
        let allBusinessData: any[] = [];

        // Navigate to Google Maps
        await page.goto("https://www.google.com/maps", {
          waitUntil: "networkidle2",
          timeout: 180000,
        });

        await page.setViewport({
          width: 1200,
          height: 800,
        });

        // Loop through each search query
        for (const query of formedData) {
          try {
            debug(`Searching for query: ${query}`);

            // Clear the search box and enter the query
            await page.waitForSelector("input#searchboxinput", { timeout: 30000 });
            await page.click("input#searchboxinput", { clickCount: 3 });
            await page.keyboard.press("Backspace");
            await page.type("input#searchboxinput", query, { delay: 50 });
            await page.keyboard.press("Enter");

            await page.waitForNavigation({waitUntil: ['networkidle2']})

            // Scrape the initial set of results
            await scrapeBusinessDetails(page, allBusinessData, query, debug);


            let shouldRun = true

            while(shouldRun){
              await scrapeBusinessDetails(page, allBusinessData, query, debug);
              await autoScroll(page, wait);
              await wait(5)
              console.log("results", allBusinessData, allBusinessData.length)
            }


            await wait(5);
          } catch (queryError) {
            debug(`Error during query "${query}": ${queryError}`);
            await wait(5);
          }
        }

        debug("Business data extracted successfully:");
        debug(allBusinessData);
      } catch (error) {
        debug(`An error occurred: ${error}`);
      }
    },
    { showBrowser: true }
  );
}
