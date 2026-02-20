// app/shopify.server.js

import "@shopify/shopify-app-react-router/adapters/node";
import {
    ApiVersion,
    AppDistribution,
    shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

if (!appUrl) {
    throw new Error("Missing SHOPIFY_APP_URL in environment variables");
}

const scopes = (process.env.SCOPES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const shopify = shopifyApp({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    apiVersion: ApiVersion.April26, // ✅ MATCHES 2026-04
    scopes,
    appUrl,
    authPathPrefix: "/auth",
    sessionStorage: new PrismaSessionStorage(prisma),
    distribution: AppDistribution.AppStore,
    future: {
        unstable_newEmbeddedAuthStrategy: true,
        expiringOfflineAccessTokens: true,
    },
});

export default shopify;

export const apiVersion = ApiVersion.April26; // ✅ MATCHES 2026-04
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;