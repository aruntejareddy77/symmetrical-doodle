import { sendSuccess } from "@vizagops/api";
import { AssignmentService } from "./service";
import { broadcastEvent } from "../../ws";
const service = new AssignmentService();
export const createAssignment = async (req: any, res: any, next: any) => {
  try {
    const telemetry = {
      requestId: req.requestId,
      userId: req.user.id,
      userEmail: req.user.email
    };
    const assignment = await service.createAssignment(req.validatedBody, telemetry);

    // Broadcast WebSocket events to all operators
    broadcastEvent("assignment.new", {
      incident_id: assignment.complaintId,
      team_id: assignment.fieldTeamId,
      priority: assignment.complaint?.priority?.toLowerCase() || "medium",
      eta_minutes: 15
    });

    broadcastEvent("complaint.updated", {
      id: assignment.complaintId,
      complaint_id: assignment.complaintId,
      status: "assigned",
      assignedTeam: assignment.fieldTeamId || "Field Response Unit",
      updatedAt: new Date().toISOString()
    });

    broadcastEvent("team.update", {
      team_id: assignment.fieldTeamId,
      status: "busy",
      location: { lat: assignment.fieldTeam?.currentLat, lng: assignment.fieldTeam?.currentLng }
    });

    sendSuccess(res, assignment, "Team assigned successfully");
  } catch (err) { next(err); }
};
export const updateAssignment = async (req: any, res: any, next: any) => {
  try {
    const telemetry = {
      requestId: req.requestId,
      userEmail: req.user.email
    };
    const assignment = await service.updateAssignmentStatus(req.params.id, req.validatedBody, telemetry);

    // Broadcast WS event for team update based on new status
    let teamStatus = "available";
    if (assignment.status === "ASSIGNED") {
      teamStatus = "busy";
    } else if (assignment.status === "IN_PROGRESS") {
      teamStatus = "on_site";
    }
    broadcastEvent("team.update", {
      team_id: assignment.fieldTeamId,
      status: teamStatus,
      location: { lat: assignment.fieldTeam?.currentLat, lng: assignment.fieldTeam?.currentLng }
    });

    sendSuccess(res, assignment, "Assignment status updated successfully");
  } catch (err) { next(err); }
};

export const getAssignments = async (req: any, res: any, next: any) => {
  try {
    const assignments = await service.getAllAssignments();
    sendSuccess(res, assignments, "Assignments retrieved successfully");
  } catch (err) { next(err); }
};
