const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");

const { logger } = require("./utils/logger");
const indexRouter = require("./routes/index");
const matchesRouter = require("./routes/matches");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const chatsRouter = require("./routes/chats");
const profileRouter = require("./routes/profile");
const groupsRouter = require("./routes/groups");
const invitationsRouter = require("./routes/invitations");

const app = express();
const cors = require("cors");
app.use(cors()); // Put this above your routes

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(function corsMiddleware(req, res, next) {
  const origin = req.get("Origin") || "http://localhost:3000";
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.use(
  pinoHttp({
    logger,
    autoLogging: true,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) {
        return "error";
      }
      if (res.statusCode >= 400) {
        return "warn";
      }
      return "info";
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/matches", matchesRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/chats", chatsRouter);
app.use("/profile", profileRouter);
app.use("/groups", groupsRouter);
app.use("/invitations", invitationsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
