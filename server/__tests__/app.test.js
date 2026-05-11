const request = require("supertest");
const app = require("../app");

describe("Express application shell", () => {
  it("serves the landing template", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  it("renders the error page for unknown paths", async () => {
    const res = await request(app).get("/this-route-should-not-exist-12345");
    expect(res.status).toBe(404);
  });
});
