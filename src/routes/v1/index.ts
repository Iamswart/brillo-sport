import { Router } from "express";
import { authRoutes } from "./auth";
import { userRoutes } from "./user";
import { sportRoutes } from "./sport";

const v1Routes: Router = Router();

v1Routes.use("/auth", authRoutes);
v1Routes.use("/user", userRoutes);
v1Routes.use("/sport", sportRoutes);


export { v1Routes };
