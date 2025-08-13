import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";

export default function () {
  test("ManagerHub Page Analytics tab", async ({ page, request }) => {
    let totalCases = 0;
    let passedCases = 0;
    let failedCases = 0;

    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;
    await page.goto(`${USER_BASE_URL}/feed`);
    await page.pause();

    try {
      // Test case 1: Verify URL
      totalCases++;
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
      passedCases++;

      // Test case 2: Get user data from localStorage
      totalCases++;
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
        throw new Error("User data not found in localStorage.");
      }
      passedCases++;

      // Test case 3: Navigate to Analytics tab
      totalCases++;
      await page.locator("#managerHub").click();
      await page.getByRole("link", { name: "Analytic" }).click();
      await page.waitForTimeout(8000);
      await expect(page.getByText("Report")).toBeVisible();
      await expect(page.getByText("Top Selection")).toBeVisible();
      await expect(page.getByText("Type")).toBeVisible();
      await expect(page.getByText("Period")).toBeVisible();
      await expect(page.getByText("Search Employee")).toBeVisible();
      passedCases++;

      // Test case 4: Award API
      totalCases++;
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
        if (awardApiResponse.status() !== 200 || !awardData?.data) {
          throw new Error("Invalid award API response");
        }
        expect(awardData.message).toBe("Request successful!");
        expect(awardData.status).toBe(200);
        passedCases++;
      } catch (error) {
        failedCases++;
        throw error;
      }

      // Test case 5: Badge API
      totalCases++;
      try {
        const badgeApiResponse = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-badges-received-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        const badgeData = await badgeApiResponse.json();
        if (
          badgeData.message === "Unauthorized" ||
          badgeApiResponse.status() !== 200 ||
          !badgeData?.data
        ) {
          throw new Error("Invalid badge API response");
        }
        expect(badgeData.message).toBe("Request successful!");
        expect(badgeData.status).toBe(200);
        passedCases++;
      } catch (error) {
        failedCases++;
        throw error;
      }

      // Test case 6: Recognition API
      totalCases++;
      try {
        const recognitionApiResponse = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-recognitions-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        const recognitionData = await recognitionApiResponse.json();
        if (
          recognitionData.message === "Unauthorized" ||
          recognitionApiResponse.status() !== 200
        ) {
          throw new Error("Invalid recognition API response");
        }
        expect(recognitionData.message).toBe("Request successful!");
        expect(recognitionData.status).toBe(200);
        passedCases++;
      } catch (error) {
        failedCases++;
        throw error;
      }

      await page.goBack();
      await page.waitForURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
    } catch (err) {
      console.error("Test failed:", err);
      failedCases++;
      throw new Error(`Test failed: ${err.message}`);
    } finally {
      console.log("------ TEST CASE SUMMARY ------");
      console.log(`Total Test Cases: ${totalCases}`);
      console.log(`Passed: ${passedCases}`);
      console.log(`Failed: ${failedCases}`);
      console.log("------------------------------");
    }
  });
}
