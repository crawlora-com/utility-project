import { browser } from "crawlora";
async function sleep(secs: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, secs * 1000);
  });
}

export default async function GetGoogleLinks({
  searches,
}: {
  searches: string[];
}) {

 await browser(async ({puppeteer}) => {
    const page = await puppeteer.newPage();

    const linksStore = [];

    for await (const searchs of searches) {
      await page.goto("https://google.com");
  
      await sleep(2);
  
      await page.type('textarea[name="q"]', searchs);
  
      await page.keyboard.press("Enter");
  
      await page.waitForNavigation({ waitUntil: ["networkidle2"] });
  
      const links = await page.$$eval("a", (anchors) =>
        anchors.map((anchor) => anchor.href)
      );
  
      linksStore.push({ [searchs]: links });
      // saveOutPut.create({sequence_id, sequence_output: {[searchs]: links}})
      await sleep(2);
    }
  }, {headless: false})
}
