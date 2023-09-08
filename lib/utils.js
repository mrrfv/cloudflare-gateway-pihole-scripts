export const isDev = () => process.env.NODE_ENV !== "production";

export const sleep = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));
