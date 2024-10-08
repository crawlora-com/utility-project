import GetGoogleLinks from "./index";

async function main() {
  const data = await GetGoogleLinks({
    searches: "Stock market",
  });
}

main();
