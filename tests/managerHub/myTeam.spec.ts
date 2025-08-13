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
//     await page.pause();
//     if (hierarchyData?.data && hierarchyData.data.length > 0) {
//       for (const team of hierarchyData.data.slice(0, 1)) {
//         const empId = team.employeeId;
//         console.log("Checking for employee ID in DOM:", empId);

//         // Optional: wait to ensure DOM is updated
//         await page.waitForTimeout(1000);

//         const matchingElements = await page.locator(`[id="${empId}"]`).count();
//         console.log("Matching DOM elements found:", matchingElements);

//         if (matchingElements === 0) {
//           throw new Error(
//             `No DOM element found with id="${empId}". Check the DOM structure.`
//           );
//         }

//         const areaButton = page.locator(`[id="${empId}"]`);
//         const idValue = await areaButton.getAttribute("id");

//         expect(idValue).toBe(empId);
//       }
//     }

//     await expect(page.locator("body")).toContainText("Manager Hub");
//   } catch (err) {
//     console.error("Test failed:", err);
//     throw new Error(`Test failed: ${err.message}`);
//   }
// });
