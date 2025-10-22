/**
 * Authorization Middleware
 * Role-based access control for counselor dashboard features
 */

const User = require("../models/User");

/**
 * Check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated (req.user set by authenticateToken)
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Fetch full user from database to get role
      const user = await User.findById(req.user.userId).select("role");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Normalize allowedRoles to array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user's role is in allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: `This endpoint requires one of the following roles: ${roles.join(", ")}`,
          userRole: user.role,
        });
      }

      // Attach role to request for use in route handlers
      req.user.role = user.role;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

/**
 * Check if counselor has access to specific student
 * Counselors can only access students who have:
 * 1. Enabled risk monitoring
 * 2. Assigned this counselor to their account
 */
const canAccessStudent = async (req, res, next) => {
  try {
    const counselorId = req.user.userId;
    const studentId = req.params.studentId || req.body.studentId;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID required" });
    }

    // Fetch student
    const student = await User.findById(studentId).select("privacySettings role");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if target is actually a student
    if (student.role !== "student") {
      return res.status(400).json({ error: "Target user is not a student" });
    }

    // Check if student has enabled risk monitoring
    if (!student.privacySettings?.riskMonitoring?.enabled) {
      return res.status(403).json({
        error: "Access denied",
        message: "Student has not enabled risk monitoring",
      });
    }

    // Check if counselor is assigned to this student
    const assignedCounselors = student.privacySettings.assignedCounselors || [];
    const isAssigned = assignedCounselors.some(
      (id) => id.toString() === counselorId
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not assigned to this student",
      });
    }

    // Attach student and share level to request
    req.student = {
      id: student._id,
      shareLevel: student.privacySettings.riskMonitoring.shareLevel,
    };

    next();
  } catch (error) {
    console.error("Student access check error:", error);
    return res.status(500).json({ error: "Access check failed" });
  }
};

/**
 * Check if user can modify alert
 * Only assigned counselors can modify alerts
 */
const canModifyAlert = async (req, res, next) => {
  try {
    const RiskAlert = require("../models/RiskAlert");
    const alertId = req.params.alertId;
    const counselorId = req.user.userId;

    const alert = await RiskAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    // Check if counselor is assigned to this alert
    const isAssigned = alert.assignedCounselors.some(
      (assignment) => assignment.counselorId.toString() === counselorId
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not assigned to this alert",
      });
    }

    req.alert = alert;
    next();
  } catch (error) {
    console.error("Alert access check error:", error);
    return res.status(500).json({ error: "Access check failed" });
  }
};

module.exports = {
  requireRole,
  canAccessStudent,
  canModifyAlert,
};
