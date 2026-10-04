import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studyRouter from "./study";
import authRouter from "./auth";
import learningPathRouter from "./learning-path";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(learningPathRouter);
router.use(studyRouter);

export default router;
