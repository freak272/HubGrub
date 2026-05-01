import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { ADMIN_KEY } from "./lib/adminAuth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  const role = req.cookies.role;

  if (role === "customer") {
    return res.redirect("/customer");
  }

  if (role === "business") {
    return res.redirect("/business?key=" + ADMIN_KEY);
  }

  res.send(`
    <h1>Welcome</h1>
    <h2>Select your role:</h2>

    <a href="/set-role/customer">🛒 Customer</a><br><br>
    <a href="/set-role/business">🏪 Business</a>
  `);
});

app.get("/set-role/:role", (req, res) => {
  const role = req.params.role;

  res.cookie("role", role);

  if (role === "customer") {
    return res.redirect("/customer");
  }

  if (role === "business") {
    return res.redirect("/business?key=" + ADMIN_KEY);
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("role");
  res.redirect("/");
});

app.use("/api", router);

export default app;
