// import { test, expect } from "@playwright/test";
// import "dotenv/config";
// import { EnvConfigPlaywright } from "../envConfig";

// test("ManagerHub Page", async ({ page, request }) => {
//   await page.addInitScript(() => {
//     localStorage.setItem("feedTour", "true");
//     localStorage.setItem("managerHubTour", "true");
//     localStorage.setItem("managerHubMyTeamTour", "true");
//     localStorage.setItem("managerHubAnalyticsTour", "true");
//     localStorage.setItem("pulseTour", "true");
//   });

//   const API_BASE_URL = EnvConfigPlaywright.apiUrl;
//   const USER_BASE_URL = EnvConfigPlaywright.userUrl;
//   const email = process.env.TEST_USER_EMAIL || "";
//   const password = process.env.TEST_USER_PASSWORD || "";

//   const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   const isPasswordValid =
//     password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);

//   if (!isEmailValid || !isPasswordValid) {
//     console.error(
//       `Input validation failed. Email: ${email}, Password: [HIDDEN]`
//     );
//     throw new Error("Input validation failed: Invalid email or weak password.");
//   }

//   try {
//     await page.goto(`${USER_BASE_URL}/login`);
//     await page.fill('input[name="email"]', email);
//     await page.fill('input[name="password"]', password);
//     await page.click('button[type="submit"]');

//     const loginAPIResp = await request.post(`${API_BASE_URL}/auth/signin`, {
//       data: { email, password },
//       headers: { "Content-Type": "application/json" },
//     });
//     const loginResponse = await loginAPIResp.json();
//     if (loginResponse.status !== 200) {
//       console.error("Login API error:", loginResponse);
//       throw new Error(
//         "Login failed: " + JSON.stringify(loginResponse, null, 2)
//       );
//     }
//     expect(loginResponse.message).toBe("Login success!");
//     await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });

//     const USER_DATA = await page.evaluate(() => {
//       try {
//         const persistedAuth = localStorage.getItem("persist:auth");
//         if (!persistedAuth) return { orgId: "", empId: "" };
//         const parsedAuth = JSON.parse(persistedAuth);
//         const userData = JSON.parse(parsedAuth.userData);
//         return {
//           orgId: userData["custom:orgId"] ?? "",
//           empId: userData["custom:empId"] ?? "",
//         };
//       } catch {
//         return { orgId: "", empId: "" };
//       }
//     });

//     if (!USER_DATA.orgId || !USER_DATA.empId) {
//       console.error("User data not found in localStorage.");
//       throw new Error("User data not found in localStorage.");
//     }

//     await page.locator("#managerHub").click();
//     ////////////////////////////////////////////////////////////

//     await page.pause();

//     await page.getByRole("link", { name: "My Team" }).click();
//     // message: "Hierarchy Data fetched successfully!";
//     // status: 200;
//     // /alpha/org/a19cb358-d788-4166-8732-565852821cde/employee/75009c0a-d1cf-474d-8df3-ddd30c7bf875/hierarchy?type=spotlight
//     await page.waitForTimeout(2000);
//     const hierarchyAPI = await request.get(
//       `${API_BASE_URL}/org/${USER_DATA.orgId}/employee/${USER_DATA.empId}/hierarchy?type=spotlight`,
//       { headers: { authorization: `Bearer ${loginResponse.data.idToken}` } }
//     );
//     const hierarchyData = await hierarchyAPI.json();
//     if (hierarchyData?.message === "Unauthorized") {
//       console.error("[Hierarchy API] Unauthorized access", hierarchyData);
//       throw new Error("Unauthorized access to the Hierarchy API.");
//     }
//     expect(hierarchyData.message).toBe("Hierarchy Data fetched successfully!");
//     expect(hierarchyData.status).toBe(200);
//     await expect(page.locator("body")).toContainText("Manager Hub");

//     // message: "Request successful!";
//     // status: 200;
//     // /alpha/org/a19cb358-d788-4166-8732-565852821cde/analytics/user/75009c0a-d1cf-474d-8df3-ddd30c7bf875/report-team/team-awards-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10
//     // const

//     // Pulse Tab section
//     await page.getByRole("button", { name: "Pulse" }).click();
//     let pulseReportData, GetAreaWise, pulseQuestionData;
//     const currentDate = new Date();
//     const sixMonthsAgo = new Date(currentDate);
//     sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
//     const DATE_ONE = sixMonthsAgo.toISOString().split("T")[0];
//     const DATE_TWO = new Date().toISOString().split("T")[0];
//     try {
//       const pulseReportAPI = await request.get(
//         `${API_BASE_URL}/org/${USER_DATA.orgId}/pulse/report?employeeId=${USER_DATA.empId}&fromDate=2025-01-30&toDate=2025-07-30&reportType=areaWise`,
//         { headers: { authorization: `Bearer ${loginResponse.data.idToken}` } }
//       );
//       pulseReportData = await pulseReportAPI.json();
//       if (pulseReportData?.message === "Unauthorized") {
//         console.error(
//           "[Pulse Report API] Unauthorized access",
//           pulseReportData
//         );
//         throw new Error("Unauthorized access to the Pulse API.");
//       }
//       expect(pulseReportData.message).toBe("Data fetched success!");
//       expect(pulseReportData.status).toBe(200);

//       const GetAreaWiseApi = await request.get(
//         `${API_BASE_URL}/org/${USER_DATA.orgId}/pulse/report?employeeId=${USER_DATA.empId}&fromDate=${DATE_ONE}&toDate=${DATE_TWO}&reportType=areaWise`,
//         { headers: { authorization: `Bearer ${loginResponse.data.idToken}` } }
//       );
//       GetAreaWise = await GetAreaWiseApi.json();
//       if (GetAreaWise?.message === "Unauthorized") {
//         console.error("[Get Area Wise API] Unauthorized access", GetAreaWise);
//         throw new Error("Unauthorized access to the Get Area Wise API.");
//       }
//       expect(GetAreaWise.message).toBe("Data fetched success!");
//       expect(GetAreaWise.status).toBe(200);
//     } catch (err) {
//       console.error("[API Error]", err);
//       throw err;
//     }

//     try {
//       if (GetAreaWise?.data && GetAreaWise.data.length > 0) {
//         for (const area of GetAreaWise.data.slice(0, 1)) {
//           const areaButton = page.locator(`[id="${area.areaId}"]`);
//           const idValue = await areaButton.getAttribute("id");
//           expect(idValue).toBe(area.areaId);
//         }
//         const areaButton = page.locator(
//           `[id="${GetAreaWise?.data[0].areaId}"]`
//         );
//         await expect(areaButton).toBeVisible();
//         await areaButton.click();
//         await page.getByRole("button", { name: "Questions" }).click();

//         // --- PULSE QUESTION API ---
//         try {
//           const pulseQuestionAPI = await request.get(
//             `${API_BASE_URL}/org/${USER_DATA.orgId}/pulse/report?areaId=${GetAreaWise?.data[0].areaId}&employeeId=${USER_DATA.empId}&fromDate=${DATE_ONE}&toDate=${DATE_TWO}&reportType=areaWiseQuestion`,
//             {
//               headers: {
//                 authorization: `Bearer ${loginResponse.data.idToken}`,
//               },
//             }
//           );
//           pulseQuestionData = await pulseQuestionAPI.json();
//           if (pulseQuestionData?.message === "Unauthorized") {
//             console.error(
//               "[Pulse Question API] Unauthorized access",
//               pulseQuestionData
//             );
//             throw new Error("Unauthorized access to the Pulse Question API.");
//           }
//           expect(pulseQuestionData.message).toBe("Data fetched success!");
//           expect(pulseQuestionData.status).toBe(200);
//         } catch (err) {
//           console.error("[Pulse Question API Error]", err);
//           throw err;
//         }
//         await page.getByRole("button", { name: "Graph" }).click();
//       }
//     } catch (err) {
//       console.error("[Interaction/UI Error]", err);
//       throw err;
//     }

//     try {
//       await page.getByRole("button", { name: "All Areas Trends" }).click();
//     } catch (err) {
//       console.error('[UI Error] Failed to click "All Areas Trends":', err);
//       throw err;
//     }
//   } catch (err) {
//     await page.screenshot({
//       path: "badge-test-unexpected-error.png",
//       fullPage: true,
//     });
//     console.error("Test failed with error:", err.message || err);
//     throw err;
//   }
// });
