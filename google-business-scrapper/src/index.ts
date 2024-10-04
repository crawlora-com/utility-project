import { showBrowser } from "./config";
import { browser } from "crawlora";

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
        debug("Start >>> Navigating to Google Maps");

        await page.goto("https://www.google.com/maps", {
          waitUntil: "networkidle2",
          timeout: 180000,
        });

        const allBusinessData = [];

        for (const query of formedData) {
          // Retry strategy for each search query

          let retries = 3;
          while (retries > 0) {
            try {
              debug(`Searching for query: ${query}`);

              // Clear the search box if it's not the first search
              await page.waitForSelector("input#searchboxinput", {
                timeout: 30000,
              });
              await page.click("input#searchboxinput", { clickCount: 3 });
              await page.keyboard.press("Backspace");

              await page.type("input#searchboxinput", query, { delay: 50 });
              await page.keyboard.press("Enter");

              // Wait for the search results to load
              await page.waitForSelector(".hfpxzc", { timeout: 60000 });

              let businessData = [];
              for (let i = 0; i < 10; i++) {
                // Retry per business result if any step fails
                let resultRetries = 3;
                while (resultRetries > 0) {
                  try {
                    const results = await page.$$(".hfpxzc");
                    if (results.length === 0 || i >= results.length) {
                      debug(
                        "No business results found or index out of bounds."
                      );
                      throw new Error(
                        "No business results or result out of bounds."
                      );
                    }

                    await results[i].click();

                    // Wait for the business details popup
                    await page.waitForSelector(".DUwDvf", { timeout: 30000 });

                    // Extract business details
                    const business = await page.evaluate(() => {
                      const name =
                        document.querySelector(".DUwDvf")?.textContent ||
                        "Name not found";
                      const address =
                        document.querySelector(".Io6YTe")?.textContent ||
                        "Address not found";
                      const website =
                        document
                          .querySelector("a.CsEnBe")
                          ?.getAttribute("href") || "Website not found";
                      const rating =
                        document.querySelector(
                          '.F7nice span[aria-hidden="true"]'
                        )?.textContent || "Rating not found";
                      const reviews =
                        document.querySelector(
                          '.F7nice span[aria-label*="reviews"]'
                        )?.textContent || "Number of reviews not found";

                      return {
                        name,
                        address,
                        website,
                        rating,
                        reviews,
                      };
                    });

                    businessData.push(business);

                    // Close the business details popup
                    const closeButton = await page.$(".yHy1rc");
                    if (closeButton) {
                      await closeButton.click();
                    } else {
                      debug(`Close button not found for result ${i + 1}.`);
                    }

                    await wait(1); // Short delay
                    break; // Break out of inner retry loop after success
                  } catch (resultError) {
                    debug(`Error processing result ${i}: ${resultError}`);
                    resultRetries -= 1;
                    await wait(2);
                    if (resultRetries === 0) {
                      debug(`Skipping result ${i} after multiple retries.`);
                    }
                  }
                }
              }

              allBusinessData.push(...businessData);
              break; // Break out of outer retry loop after successful query
            } catch (queryError) {
              debug(`Error during query "${query}": ${queryError}`);
              retries -= 1;
              await wait(10); // Wait 10 seconds before retrying query
              if (retries === 0) {
                debug(`Skipping query "${query}" after multiple retries.`);
              }
            }
          }
        }

        debug("Business data extracted successfully:");
        debug(allBusinessData);
      } catch (error) {
        debug(`An error occurred: ${error}`);
      }
    },
    { showBrowser }
  );
}
