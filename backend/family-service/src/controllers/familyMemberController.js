import { familyMemberService } from '../services/familyMemberService.js';

export const familyMemberController = {
  async addMember(req, res, next) {
    try {
      const newMember = await familyMemberService.addMember(req.user, req.body);
      res.status(201).json({
        success: true,
        message: 'Family member added successfully',
        data: newMember,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMembers(req, res, next) {
    try {
      const members = await familyMemberService.getMembers(req.user);
      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMemberById(req, res, next) {
    try {
      const { memberId } = req.params;
      const member = await familyMemberService.getMemberById(req.user, memberId);
      res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const updated = await familyMemberService.updateMember(req.user, memberId, req.body);
      res.status(200).json({
        success: true,
        message: 'Family member updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { memberId } = req.params;
      await familyMemberService.removeMember(req.user, memberId);
      res.status(200).json({
        success: true,
        message: 'Family member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
