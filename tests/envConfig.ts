// tests/config/envConfig.ts

type StageName = "alpha" | "alpha" | "prod";

type ConfigSchema = Record<
  StageName,
  {
    apiUrl: string;
    userUrl: string;
    adminUrl: string;
  }
>;

const configData: ConfigSchema = {
  local: {
    apiUrl: "https://ln2npaai4i.execute-api.us-east-1.amazonaws.com/alpha",
    userUrl: "http://localhost:5173",
    adminUrl: "http://localhost:3000",
  },
  alpha: {
    apiUrl: "https://ln2npaai4i.execute-api.us-east-1.amazonaws.com/alpha",
    userUrl: "https://main.d1vos4qfjhiyoz.amplifyapp.com",
    adminUrl: "https://main.d2amgi1rm0yth4.amplifyapp.com",
  },
  prod: {
    apiUrl: "https://pcj8zmeleh.execute-api.us-east-1.amazonaws.com/prod",
    userUrl: "https://app.us.prod.wazopulse.com",
    adminUrl: "https://admin.app.us.prod.wazopulse.com",
  },
};

const stage =
  ((process.env.STAGE_NAME || process.env.VITE_STAGE_NAME) as StageName) ||
  "local";

export const EnvConfigPlaywright = configData[stage];

export const testCredentials = {
  email: process.env.TEST_USER_EMAIL || "wabib72127@bizmud.com",
  password: process.env.TEST_USER_PASSWORD || "Sum@n123",
};
