import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";

export default function () {
  test("Analytics Page", async ({ page, request }) => {
    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;
    await page.goto(`${USER_BASE_URL}/feed`);

    try {
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });

      const USER_DATA = await page.evaluate(() => {
        try {
          const persistedAuth = localStorage.getItem("persist:auth");
          if (!persistedAuth) return { orgId: "", empId: "" };
          const parsedAuth = JSON.parse(persistedAuth);
          const userData = JSON.parse(parsedAuth.userData);
          return {
            orgId: userData["custom:orgId"] ?? "",
            empId: userData["custom:empId"] ?? "",
          };
        } catch {
          return { orgId: "", empId: "" };
        }
      });

      if (!USER_DATA.orgId || !USER_DATA.empId) {
        console.error("User data not found in localStorage.");
        throw new Error("User data not found in localStorage.");
      }

      // First analytics navigation via button
      await page.locator("#managerHub").click();
      await page.getByRole("link", { name: "Analytic" }).click();
      await page.waitForTimeout(8000);

      await expect(page.getByText("Report")).toBeVisible();
      await expect(page.getByText("Top Selection")).toBeVisible();
      await expect(page.getByText("Type")).toBeVisible();
      await expect(page.getByText("Period")).toBeVisible();
      await expect(page.getByText("Search Employee")).toBeVisible();

      try {
        const awardApiResponse = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-awards-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        const awardData = await awardApiResponse.json();
        if (awardApiResponse.status() !== 200) {
          console.error("Failed to fetch analytics data");
          throw new Error("Failed to fetch analytics data");
        }

        if (!awardData || !awardData.data) {
          console.error("No award data found in the response.");
          throw new Error("No award data found in the response.");
        }
        expect(awardData.message).toBe("Request successful!");
        expect(awardData.status).toBe(200);
      } catch (error) {
        console.error("Error in fetching analytics data:", error);
        throw new Error("Error in fetching analytics data: " + error);
      }

      try {
        // /alpha/org/a19cb358-d788-4166-8732-565852821cde/analytics/user/75009c0a-d1cf-474d-8df3-ddd30c7bf875/report-team/team-badges-received-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10

        const badgeApiResponse = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-badges-received-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        const badgeData = await badgeApiResponse.json();
        if (badgeApiResponse.status() !== 200) {
          console.error("Failed to fetch badge analytics data");
          throw new Error("Failed to fetch badge analytics data");
        }
        if (!badgeData || !badgeData.data) {
          console.error("No badge data found in the response.");
          throw new Error("No badge data found in the response.");
        }
        expect(badgeData.message).toBe("Request successful!");
        expect(badgeData.status).toBe(200);
      } catch (error) {
        console.error("Error in fetching analytics data:", error);
        throw new Error("Error in fetching analytics data: " + error);
      }

      await page.goBack();
    } catch (err: any) {
      console.error("Test failed:", err);
      throw new Error(`Test failed: ${err.message}`);
    }
  });
}
