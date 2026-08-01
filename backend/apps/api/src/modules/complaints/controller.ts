import { sendSuccess } from "@vizagops/api";
import { ComplaintService } from "./service";
import { broadcastEvent } from "../../ws";

const service = new ComplaintService();

export const createComplaint = async (req: any, res: any, next: any) => {
  try {
    const telemetry = { requestId: req.requestId };
    const complaint = await service.processComplaint(req.validatedBody, telemetry);

    // Broadcast mapped event for frontend operators
    broadcastEvent("complaint.new", {
      id: complaint.id,
      complaint_id: complaint.id,
      title: complaint.title,
      type: complaint.category?.toLowerCase() || "pothole",
      category: complaint.category || "INFRASTRUCTURE",
      priority: complaint.priority || "HIGH",
      description: complaint.description || "",
      location: { lat: complaint.latitude, lng: complaint.longitude },
      latitude: complaint.latitude || 17.6868,
      longitude: complaint.longitude || 83.2185,
      ward: complaint.ward || "GVMC-W12",
      ward_id: complaint.ward || "GVMC-W12",
      status: complaint.status?.toLowerCase() || "received",
      reported_at: complaint.createdAt,
      createdAt: complaint.createdAt
    });

    sendSuccess(res, complaint, "Complaint processed and audited successfully");
  } catch (err) { next(err); }
};

export const getComplaints = async (req: any, res: any, next: any) => {
  try {
    const role = req.user?.role;
    let complaints;
    if (role === "CITIZEN" && req.user?.id) {
      complaints = await service.getComplaintsByCitizen(req.user.id);
    } else {
      complaints = await service.getAllComplaints();
    }
    sendSuccess(res, complaints, "Complaints retrieved successfully");
  } catch (err) { next(err); }
};
