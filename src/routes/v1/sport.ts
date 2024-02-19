import { celebrate } from "celebrate";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import SportController from "../../controller/sport";
import {
  apiKeyAuthMiddleware,
  protect,
  checkAdmin, 
} from "../../middleware/auth";

import { sportNameSchema } from "../../utils/validationSchema";

const sportRoutes: Router = Router();
const sportController = new SportController();

sportRoutes.post(
  "/create-sport",
  apiKeyAuthMiddleware,
  celebrate({ body: sportNameSchema }),
  protect,
  checkAdmin,
  asyncHandler(async (request: Request, response: Response) => {
    const { name } = request.body;
    const data = await sportController.createSport(name);

    response.status(201).json(data).end();
  })
);

sportRoutes.get(
  "/all-sports",
  apiKeyAuthMiddleware,
  protect,
  asyncHandler(async (request: Request, response: Response) => {
    const data = await sportController.getAllSports();
    response.status(200).json(data).end();
  })
);

export { sportRoutes };
