import { Router } from "express";
import users from "./userRoutes.js";

const router = Router();

// Main API routes - all routes are prefixed with /api
// Example: POST /api/users/register

/*
To add new route modules:

import newModule from "./newModuleRoutes.js";
router.use("/new-module", newModule);
*/

// User and authentication routes
router.use("/users", users);

export default router;
