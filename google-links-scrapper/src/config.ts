const { env } = process

export const sequence_id = env["CRAWLORA_SEQUENCE_ID"];

if (!sequence_id) {
  throw new Error(`No sequence id found`);
}


export const auth_key = env['CRAWLORA_AUTH_KEY']

if (!sequence_id) {
  throw new Error(`No auth key found`);
}