import fs from "fs";
import path from "path";
import { handleError } from "../handleError";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";

const authFilePath = path.resolve(
  process.cwd(),
  "tests/authService/playwright/.auth/user.json"
);

let orgId = "";
let empId = "";
let idToken = "";
let isAdmin = "";

try {
  const authRaw = fs.readFileSync(authFilePath, "utf-8");
  const authData = JSON.parse(authRaw);

  if (!authData?.origins || !Array.isArray(authData.origins)) {
    throw new Error("Invalid or missing 'origins' in user.json");
  }

  // ✅ Use stage-specific URL from config
  const expectedOrigin = EnvConfigPlaywright.userUrl.replace(/\/$/, ""); // remove trailing slash

  // Match any origin that contains the domain (works for localhost, alpha, prod)
  const originData = authData.origins.find((o: any) =>
    o.origin?.includes(expectedOrigin)
  );

  if (!originData || !originData.localStorage) {
    throw new Error(
      `No matching origin or localStorage found for '${expectedOrigin}'`
    );
  }

  const persistAuthEntry = originData.localStorage.find(
    (entry: any) => entry.name === "persist:auth"
  );

  if (persistAuthEntry) {
    const parsedPersistAuth = JSON.parse(persistAuthEntry.value);

    const userData = JSON.parse(parsedPersistAuth.userData || "{}");
    orgId = userData["custom:orgId"] || "";
    empId = userData["custom:empId"] || "";
    isAdmin = userData["custom:isAdmin"] || "";

    idToken = JSON.parse(parsedPersistAuth.idToken || "null");
  } else {
    handleError("Missing 'persist:auth' in localStorage", {
      file: authFilePath,
      origin: originData.origin,
    });
  }
} catch (err: any) {
  handleError("Failed to parse user.json", {
    file: authFilePath,
    error: err.message,
    stack: err.stack,
  });
}

export { orgId, empId, idToken, isAdmin };
