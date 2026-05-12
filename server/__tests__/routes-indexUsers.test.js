const path = require("path");
const express = require("express");
const request = require("supertest");

const indexRouter = require("../routes/index");
const usersRouter = require("../routes/users");

describe("routes/index & routes/users", () => {
  it("renders splash page", async () => {
    const app = express();
    app.set("views", path.join(__dirname, "../views"));
    app.set("view engine", "jade");
    app.use("/", indexRouter);

    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Express");
  });

  it("responds on users scaffold", async () => {
    const app = express();
    app.use("/", usersRouter);

    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("resource");
  });
});
