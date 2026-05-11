describe("config", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
    jest.resetModules();
  });

  it("applies typed defaults when env omitted", () => {
    jest.resetModules();
    process.env.NODE_ENV = "development";
    delete process.env.MATCHING_THRESHOLD;
    delete process.env.LOG_LEVEL;

    const { config } = require("../config/index");
    expect(config.matching.threshold).toBe(80);
    expect(config.redis.url).toBeDefined();
    expect(config.auth.jwtSecret).toBeDefined();
    expect(["debug", "info"]).toContain(config.logging.level);
  });

  it("parses MATCHING_THRESHOLD and booleans", () => {
    jest.resetModules();
    process.env.NODE_ENV = "production";
    process.env.MATCHING_THRESHOLD = "50";
    process.env.DB_SYNC = "false";
    process.env.DB_SYNC_ALTER = "1";

    const { config } = require("../config/index");
    expect(config.matching.threshold).toBe(50);
    expect(config.db.sync).toBe(false);
    expect(config.db.syncAlter).toBe(true);
    expect(["debug", "info"]).toContain(config.logging.level);
  });
});
