import { Router } from "express";
import { validateRequest } from "@vizagops/api";
import { CreateComplaintSchema } from "@vizagops/validation";
import { createComplaint, getComplaints } from "./controller";

const router = Router();
router.post("/", validateRequest(CreateComplaintSchema), createComplaint);
router.get("/", getComplaints);
export default router;
