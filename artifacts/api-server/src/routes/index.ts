import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studyRouter from "./study";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studyRouter);

export default router;
