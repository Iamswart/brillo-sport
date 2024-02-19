import logger from "../logger";
import SportService from "../services/sport";

export default class SportController {
  private sportService = new SportService();

  async createSport(name: string) {
    try {
      return await this.sportService.createSport(name);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async getAllSports() {
    try {
      return await this.sportService.getAllSports();
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
