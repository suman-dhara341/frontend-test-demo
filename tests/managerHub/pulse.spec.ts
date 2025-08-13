import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";

export default function () {
  test("ManagerHubs Page Pulse tab", async ({ page, request }) => {
    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    try {
      await page.goto(`${USER_BASE_URL}/feed`);

      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, {
        timeout: 80000,
      });

      await page.pause();

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

      // Pulse Tab section
      await page.getByRole("link", { name: "Pulse" }).click();

      let pulseReportData, GetAreaWise, pulseQuestionData;
      const currentDate = new Date();
      const sixMonthsAgo = new Date(currentDate);
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
      const DATE_ONE = sixMonthsAgo.toISOString().split("T")[0];
      const DATE_TWO = new Date().toISOString().split("T")[0];
      try {
        const pulseReportAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/pulse/report?employeeId=${USER_DATA.empId}&fromDate=2025-01-30&toDate=2025-07-30&reportType=areaWise`,
          {
            headers: {
              authorization: `Bearer ${idToken}`,
            },
          }
        );
        pulseReportData = await pulseReportAPI.json();
        if (pulseReportData?.message === "Unauthorized") {
          console.error(
            "[Pulse Report API] Unauthorized access",
            pulseReportData
          );
          throw new Error("Unauthorized access to the Pulse API.");
        }
        expect(pulseReportData.message).toBe("Data fetched success!");
        expect(pulseReportData.status).toBe(200);

        const GetAreaWiseApi = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/pulse/report?employeeId=${USER_DATA.empId}&fromDate=${DATE_ONE}&toDate=${DATE_TWO}&reportType=areaWise`,
          {
            headers: {
              authorization: `Bearer ${idToken}`,
            },
          }
        );
        GetAreaWise = await GetAreaWiseApi.json();
        if (GetAreaWise?.message === "Unauthorized") {
          console.error("[Get Area Wise API] Unauthorized access", GetAreaWise);
          throw new Error("Unauthorized access to the Get Area Wise API.");
        }
        expect(GetAreaWise.message).toBe("Data fetched success!");
        expect(GetAreaWise.status).toBe(200);
      } catch (err) {
        console.error("[API Error]", err);
        throw err;
      }

      try {
        if (GetAreaWise?.data && GetAreaWise.data.length > 0) {
          for (const area of GetAreaWise.data.slice(0, 1)) {
            const areaButton = page.locator(`[id="${area.areaId}"]`);
            const idValue = await areaButton.getAttribute("id");
            expect(idValue).toBe(area.areaId);
          }
          const areaButton = page.locator(
            `[id="${GetAreaWise?.data[0].areaId}"]`
          );
          await expect(areaButton).toBeVisible();
          await areaButton.click();
          await page.getByRole("button", { name: "Questions" }).click();

          await page.locator("#selectMonthButton").click();
          await expect(page.getByText("April")).toBeVisible();
          await page.getByText("April").click();

          // --- PULSE QUESTION API ---
          try {
            const pulseQuestionAPI = await request.get(
              `${API_BASE_URL}/org/${USER_DATA.orgId}/pulse/report?areaId=${GetAreaWise?.data[0].areaId}&employeeId=${USER_DATA.empId}&fromDate=${DATE_ONE}&toDate=${DATE_TWO}&reportType=areaWiseQuestion`,
              {
                headers: {
                  authorization: `Bearer ${idToken}`,
                },
              }
            );
            pulseQuestionData = await pulseQuestionAPI.json();
            if (pulseQuestionData?.message === "Unauthorized") {
              console.error(
                "[Pulse Question API] Unauthorized access",
                pulseQuestionData
              );
              throw new Error("Unauthorized access to the Pulse Question API.");
            }
            expect(pulseQuestionData.message).toBe("Data fetched success!");
            expect(pulseQuestionData.status).toBe(200);
          } catch (err) {
            console.error("[Pulse Question API Error]", err);
            throw err;
          }
          await page.getByRole("button", { name: "Graph" }).click();
        }
      } catch (err) {
        console.error("[Interaction/UI Error]", err);
        throw err;
      }

      try {
        await page.getByRole("button", { name: "All Areas Trends" }).click();
      } catch (err) {
        console.error('[UI Error] Failed to click "All Areas Trends":', err);
        throw err;
      }
    } catch (err) {
      await page.screenshot({
        path: "badge-test-unexpected-error.png",
        fullPage: true,
      });
      console.error("Test failed with error:", err.message || err);
      throw err;
    }
  });
}
