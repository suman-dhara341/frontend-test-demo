// index.spec.ts
import badgeSpec from "./badges/badge.spec";
import logoutSpec from "./auth/logout.spec";
import feedSpec from "./feed/feed.spec";
import hierarchySpec from "./hierarchy/hierarchy.spec";
import employeeGoalsSpec from "./EmployeeGoals/employeeGoals.spec";
import growthSpec from "./growth/growth.spec";
import profileSpec from "./profile/profile.spec";
import awardsSpec from "./awards/award.spec";
import { isAdmin } from "./authService/orgId_empId";
import dashboardSpec from "./managerHub/dashboard.spec";
import pulseSpec from "./managerHub/pulse.spec";
import analyticsSpec from "./managerHub/analytics.spec";

feedSpec();
profileSpec();
awardsSpec();
badgeSpec();
hierarchySpec();
employeeGoalsSpec();
if (!isAdmin) growthSpec();
growthSpec();
// dashboardSpec();
// analyticsSpec();
// pulseSpec(); /
logoutSpec();
