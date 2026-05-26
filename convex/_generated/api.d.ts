/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abandonedCarts from "../abandonedCarts.js";
import type * as adminCli from "../adminCli.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as blogs from "../blogs.js";
import type * as bundles from "../bundles.js";
import type * as customerBehavior from "../customerBehavior.js";
import type * as designContests from "../designContests.js";
import type * as emailCampaigns from "../emailCampaigns.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as imageMigration from "../imageMigration.js";
import type * as influencers from "../influencers.js";
import type * as inventory from "../inventory.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_products from "../lib/products.js";
import type * as lib_timestamp from "../lib/timestamp.js";
import type * as liveActivity from "../liveActivity.js";
import type * as loyalty from "../loyalty.js";
import type * as migrations from "../migrations.js";
import type * as newsletter from "../newsletter.js";
import type * as orders from "../orders.js";
import type * as pricingRules from "../pricingRules.js";
import type * as products from "../products.js";
import type * as promoCodes from "../promoCodes.js";
import type * as reviews from "../reviews.js";
import type * as userExtras from "../userExtras.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as wishlists from "../wishlists.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abandonedCarts: typeof abandonedCarts;
  adminCli: typeof adminCli;
  analytics: typeof analytics;
  auth: typeof auth;
  blogs: typeof blogs;
  bundles: typeof bundles;
  customerBehavior: typeof customerBehavior;
  designContests: typeof designContests;
  emailCampaigns: typeof emailCampaigns;
  events: typeof events;
  files: typeof files;
  http: typeof http;
  imageMigration: typeof imageMigration;
  influencers: typeof influencers;
  inventory: typeof inventory;
  "lib/auth": typeof lib_auth;
  "lib/products": typeof lib_products;
  "lib/timestamp": typeof lib_timestamp;
  liveActivity: typeof liveActivity;
  loyalty: typeof loyalty;
  migrations: typeof migrations;
  newsletter: typeof newsletter;
  orders: typeof orders;
  pricingRules: typeof pricingRules;
  products: typeof products;
  promoCodes: typeof promoCodes;
  reviews: typeof reviews;
  userExtras: typeof userExtras;
  userProfiles: typeof userProfiles;
  users: typeof users;
  wishlists: typeof wishlists;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
