import { Router, type IRouter } from "express";
import healthRouter from "./health";
import inventoryRouter from "./inventory";
import ordersRouter from "./orders";
import statsRouter from "./stats";
import businessRouter from "./business";
import bRouter from "./b";

const router: IRouter = Router();

router.use(healthRouter);
router.use(inventoryRouter);
router.use(ordersRouter);
router.use(statsRouter);
router.use(businessRouter);
router.use(bRouter);

export default router;
