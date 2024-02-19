import UserService from "../services/user";
import logger from "../logger";
import { updateProfileInterface } from "../interfaces/user";
import { Request } from "express";

export default class UserController {
  private userService = new UserService();

  async sendEmailVerificationLink(userId: string) {
    try {
      return await this.userService.sendEmailVerificationLink(userId);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
  
  async verifyEmail(req: Request) {
    try {
      return await this.userService.verifyEmail(req);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async sendPhoneVerificationCode(userId: string) {
    try {
      return await this.userService.sendPhoneVerificationCode(userId);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async verifyPhone(userId: string, token: string) {
    try {
      return await this.userService.verifyPhone(userId, token);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async updateProfile(input: updateProfileInterface, userId: string) {
    try {
      return await this.userService.updateProfile(input, userId);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }



  async getUserProfile(userId: string) {
    try {
      return await this.userService.getUserProfile(userId);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }


  async updateUserSportsInterests(userId: string, sportIds: string[]) {
    try {
      return await this.userService.updateUserSportsInterests(userId, sportIds);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
