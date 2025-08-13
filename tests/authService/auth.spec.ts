import test, { chromium, request, expect, FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { fileURLToPath } from "url";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalSetup = async (config: FullConfig) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let total = 0;
  let passed = 0;
  let failed = 0;

  await page.addInitScript(() => {
    localStorage.setItem("feedTour", "true");
    localStorage.setItem("goalsTour", "true");
    localStorage.setItem("profileTour", "true");
    localStorage.setItem("goalsDetailsTour", "true");
    localStorage.setItem("anonymousFeedbackPlaywright", "true");
    localStorage.setItem("growthTour", "true");
    localStorage.setItem("hierarchyTour", "true");
    localStorage.setItem("badgesDetailsTour", "true");
    localStorage.setItem("managerHubTour", "true");
    localStorage.setItem("managerHubMyTeamTour", "true");
    localStorage.setItem("managerHubAnalyticsTour", "true");
    localStorage.setItem("pulseTour", "true");
  });

  const API_BASE_URL = EnvConfigPlaywright.apiUrl;
  const USER_BASE_URL = "https://main.d1vos4qfjhiyoz.amplifyapp.com";
  const email = process.env.TEST_USER_EMAIL ?? "";
  const password = process.env.TEST_USER_PASSWORD ?? "";

  total++;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid =
    password &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);

  if (!isEmailValid || !isPasswordValid) {
    handleError("Invalid test credentials", {
      email,
      passwordLength: password?.length,
    });
    failed++;
    throw new Error("Invalid email or weak password.");
  } else {
    passed++;
  }

  try {
    total++;
    await page.goto(`${USER_BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    passed++;

    total++;
    const authData = await page.waitForFunction(
      () => {
        const raw = localStorage.getItem("persist:auth");
        if (!raw) return null;

        try {
          const parsed = JSON.parse(raw);
          const user = JSON.parse(parsed.userData || "{}");
          const idToken = JSON.parse(parsed.idToken || "null");

          if (user["custom:orgId"] && user["custom:empId"] && idToken) {
            return {
              orgId: user["custom:orgId"],
              empId: user["custom:empId"],
              email: user["email"],
              idToken,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
      { timeout: 10000 }
    );

    const userData = await authData.jsonValue();

    if (!userData?.idToken) {
      handleError("Failed to extract idToken from localStorage", {
        storageState: await page.context().storageState(),
      });
      failed++;
      throw new Error("idToken not found after login.");
    } else {
      passed++;
    }

    total++;
    const authStatePath = path.join(__dirname, "./playwright/.auth/user.json");
    fs.mkdirSync(path.dirname(authStatePath), { recursive: true });
    await page.context().storageState({ path: authStatePath });
    passed++;

    total++;
    const requestContext = await request.newContext();
    const response = await requestContext.post(`${API_BASE_URL}/auth/signin`, {
      data: { email, password },
      headers: { "Content-Type": "application/json" },
    });

    const loginResponse = await response.json();

    if (loginResponse.status !== 200) {
      handleError("Login API failed", { loginResponse });
      failed++;
      throw new Error(
        `Login API failure: ${JSON.stringify(loginResponse, null, 2)}`
      );
    }

    try {
      expect(loginResponse.message).toBe("Login success!");
      expect(loginResponse.status).toBe(200);
      passed++;
    } catch (assertionError) {
      failed++;
      throw assertionError;
    }
  } catch (error: any) {
    handleError("Global setup failed", {
      errorMessage: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    await browser.close();
    // await publishMetric(total, passed, failed, "Login Page Tests");
  }
};

export default globalSetup;
