const { env } = process;

export const sequence_id = env["CRAWLORA_SEQUENCE_ID"] || "";

export const auth_key = env["CRAWLORA_AUTH_KEY"] || "";
