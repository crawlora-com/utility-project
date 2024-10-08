import { sequence_id, auth_key } from "./config";
import { browser } from "crawlora";

export default async function GetGoogleLinks({
  searches,
}: {
  searches: string;
}): Promise<void> {
  const formedData = searches
    .trim()
    .split("\n")
    .map((v) => v.trim());

  await browser(
    async ({ page, wait, debug, output }) => {
      const csvData: {
        searchQuery: string;
        resultNumber: number;
        title: string;
        link: string;
        description: string;
      }[] = [];

      for await (const searchQuery of formedData) {
        try {
          await page.goto("https://google.com");
          debug(`Visiting Google for search: "${searchQuery}"`);

          await wait(2);

          await page.type('textarea[name="q"]', searchQuery);
          await page.keyboard.press("Enter");
          await page.waitForNavigation({ waitUntil: "networkidle2" });

          const allResults = await page.evaluate(() => {
            const items = [...document.querySelectorAll("div.g")];
            return items.map((item) => {
              const title = item.querySelector("h3")?.innerText || "No title";
              const link = item.querySelector("a")?.href || "No link";
              const description =
                (item.querySelector("div.IsZvec") as HTMLElement)?.innerText ||
                (item.querySelector("div[data-sncf='1']") as HTMLElement)
                  ?.innerText ||
                (item.querySelector("div[data-snf='nke7rc']") as HTMLElement)
                  ?.innerText ||
                "no description";

              return {
                title,
                link,
                description,
              };
            });
          });

          await wait(2);

          allResults.forEach((result, index) => {
            csvData.push({
              searchQuery,
              resultNumber: index + 1,
              title: result.title,
              link: result.link,
              description: result.description,
            });
          });
        } catch (error) {
          console.error(`Error fetching results for "${searchQuery}":`, error);
        }
      }

      await Promise.all(
        csvData.map(async (entry) => {
          await output.create({
            sequence_id,
            sequence_output: entry,
          });
        })
      );

      console.log(
        "Final CSV-formatted data: ",
        JSON.stringify(csvData, null, 2)
      );
    },
    {
      apikey: auth_key,
      showBrowser: true,
    }
  );
}
