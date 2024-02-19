import { badRequestError } from "../error";
import Sport from "../models/sport";

export default class SportService {
  async createSport(name: string) {
    const sportExist = await Sport.findOne({ name });
    if (sportExist) {
      throw badRequestError("Sport already exist");
    }

    const sport = await Sport.create({ name })

    return sport
  }

  async getAllSports() {
    const sports = await Sport.find({});
    return sports;
  }
}
