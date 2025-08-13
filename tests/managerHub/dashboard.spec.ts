import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";

export default function () {
  test("ManagerHub Page", async ({ page, request }) => {
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

      await page.locator("#managerHub").click();

      // Go to Dashboard section
      try {
        await page.getByRole("link", { name: "Dashboard" }).click();
        await expect(page).toHaveURL(
          `${USER_BASE_URL}/managerHub?tab=Dashboard`
        );
      } catch (err: any) {
        throw new Error(`Failed to navigate to Dashboard tab. ${err.message}`);
      }

      const awardReportAPI = await request.get(
        `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-awards-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
        {
          headers: { authorization: `Bearer ${idToken}` },
        }
      );
      const awardReportData = await awardReportAPI.json();

      if (awardReportData?.message === "Unauthorized") {
        throw new Error("Unauthorized access to the Award API.");
      }

      if (awardReportData?.data && awardReportData.data.length > 0) {
        const totalAwardCount = await awardReportData.data.reduce(
          (total: number, item: any) => {
            return total + Number(item.total_awards || 0);
          },
          0
        );

        try {
          await page.waitForSelector("#totalAwardCount", { timeout: 10000 });
          await expect(page.locator("#totalAwardCount")).toHaveText(
            totalAwardCount.toString()
          );
        } catch (err: any) {
          throw new Error(
            `Award count mismatch or element not found.\nExpected: ${totalAwardCount}\nError: ${err.message}`
          );
        }
      }

      const recognitionReportAPI = await request.get(
        `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-recognitions-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
        {
          headers: { authorization: `Bearer ${idToken}` },
        }
      );
      const recognitionReportData = await recognitionReportAPI.json();

      if (recognitionReportData?.message === "Unauthorized") {
        throw new Error("Unauthorized access to the Recognition API.");
      }

      expect(recognitionReportData.message).toBe("Request successful!");
      expect(recognitionReportData.status).toBe(200);

      if (
        recognitionReportData?.data &&
        recognitionReportData.data.length > 0
      ) {
        const totalRecognitionCount = await recognitionReportData.data.reduce(
          (total: number, item: any) => {
            return total + Number(item.total_recognitions || 0);
          },
          0
        );

        try {
          await page.waitForSelector("#totalRecognitionCount", {
            timeout: 10000,
          });
          await expect(page.locator("#totalRecognitionCount")).toHaveText(
            totalRecognitionCount.toString()
          );
        } catch (err: any) {
          throw new Error(
            `Recognition count mismatch or element not found.\nExpected: ${totalRecognitionCount}\nError: ${err.message}`
          );
        }
      }

      const badgeReportAPI = await request.get(
        `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-badges-received-x-period-month-on-month?period=last6Months&userType=receiver&empIds=`,
        {
          headers: { authorization: `Bearer ${idToken}` },
        }
      );

      const badgeReportData = await badgeReportAPI.json();

      if (badgeReportData?.message === "Unauthorized") {
        throw new Error("Unauthorized access to the Badge API.");
      }

      expect(badgeReportData.message).toBe("Request successful!");
      expect(badgeReportData.status).toBe(200);

      if (badgeReportData?.data && badgeReportData.data.length > 0) {
        const totalBadgeCount = await badgeReportData.data.reduce(
          (total: number, item: any) => {
            return total + Number(item.total_badges || 0);
          },
          0
        );

        try {
          await page.waitForSelector("#totalBadgeCount", { timeout: 10000 });
          await expect(page.locator("#totalBadgeCount")).toHaveText(
            totalBadgeCount.toString()
          );
        } catch (err: any) {
          throw new Error(
            `Badge count mismatch or element not found.\nExpected: ${totalBadgeCount}\nError: ${err.message}`
          );
        }
      }

      try {
        await page.getByRole("button", { name: "Last 6 Months" }).click();
        await expect(page.getByText("Last 3 Months")).toBeVisible();
        await page.getByText("Last 3 Months").click();

        await page.waitForTimeout(500);
        await page.getByText("Last 3 Months").click();

        await expect(page.getByText("Last Year")).toBeVisible();
        await page.getByText("Last Year").click();

        await expect(
          page.getByRole("button", { name: "Received" })
        ).toBeVisible();
        await page.getByRole("button", { name: "Received" }).click();

        await expect(page.getByText("Given")).toBeVisible();
        await page.getByText("Given").click();
        await page.waitForTimeout(1000);

        await expect(page.getByText("Last Year")).toBeVisible();
        await page.getByText("Last Year").click();
        await page.waitForTimeout(1000);

        await expect(page.getByText("Last 3 Months")).toBeVisible();
        await page.getByText("Last 3 Months").click();
        await page.waitForTimeout(1000);

        await page.getByText("Last 3 Months").click();
        await page.waitForTimeout(1000);

        await expect(page.getByText("Last 6 Months")).toBeVisible();
        await page.getByText("Last 6 Months").click();
      } catch (err: any) {
        throw new Error(
          `Dashboard filter interaction failed.\nError: ${err.message}`
        );
      }

      await page.getByRole("button", { name: "Analytics" }).click();
      await page.waitForTimeout(8000);
      await expect(page.getByText("Report")).toBeVisible();
      await expect(page.getByText("Top Selection")).toBeVisible();
      await expect(page.getByText("Type")).toBeVisible();
      await expect(page.getByText("Period")).toBeVisible();
      await expect(page.getByText("Search Employee")).toBeVisible();
      await page.goBack();

      await page.locator("#managerHub").click();

      await page.getByRole("link", { name: "Analytic" }).click();
      await expect(page.getByText("Report")).toBeVisible();
      await expect(page.getByText("Top Selection")).toBeVisible();
      await expect(page.getByText("Type")).toBeVisible();
      await expect(page.getByText("Period")).toBeVisible();
      await expect(page.getByText("Search Employee")).toBeVisible();
    } catch (err: any) {
      console.error("Test failed:", err);
      throw new Error(`Test failed: ${err.message}`);
    }
  });
}
