export const sequence_id = process.env["CRAWLORA_SEQUENCE_ID"];
console.log("------------------", sequence_id);

if (!sequence_id) {
  throw new Error(`No sequence id found`);
}
