import { PublicClientApplication, LogLevel } from "@azure/msal-browser";
import type { Configuration } from "@azure/msal-browser";


function must(name: string, v?: string) {
  if (!v) throw new Error(`[MSAL config] Missing ${name}. Check .env.local`);
  return v;
}

const CLIENT_ID  = must("VITE_AZ_CLIENT_ID",  import.meta.env.VITE_AZ_CLIENT_ID);
const TENANT_ID  = must("VITE_AZ_TENANT_ID",  import.meta.env.VITE_AZ_TENANT_ID);


const REDIRECT_URI =
  import.meta.env.VITE_AZ_REDIRECT_URI ??
  import.meta.env.VITE_APP_REDIRECT_URI ??
  `${window.location.origin}/`;

const POST_LOGOUT_REDIRECT_URI =
  import.meta.env.VITE_AZ_LOGOUT_REDIRECT ??
  import.meta.env.VITE_APP_LOGOUT_REDIRECT ??
  `${window.location.origin}/login`;

const config: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
    navigateToLoginRequestUrl: false,
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Info,
      piiLoggingEnabled: false,
      loggerCallback: (_level, message, containsPii) => {
        if (!containsPii && message) console.log("[MSAL]", message);
      },
    },
  },
};

export const msal = new PublicClientApplication(config);
export const appRedirectUri = config.auth.redirectUri!;
export const signinScopes: string[] = ["openid", "profile", "email"];

let initialized = false;
export async function ensureMsal() {
  if (!initialized) {
    await msal.initialize();
    initialized = true;
  }
  return msal;
}
