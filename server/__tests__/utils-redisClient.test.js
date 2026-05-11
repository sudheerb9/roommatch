describe("redisClient", () => {
  it("reuses an already-open connection", () => {
    jest.resetModules();
    const client = {
      isOpen: true,
      connect: jest.fn(),
      on: jest.fn(),
    };
    jest.doMock("redis", () => ({
      createClient: jest.fn(() => client),
    }));

    const { ensureRedisConnected, redisClient } = require("../utils/redisClient");
    return expect(ensureRedisConnected()).resolves.toBe(redisClient);
  });

  it("waits for a single in-flight connect attempt", async () => {
    jest.resetModules();
    const client = {
      isOpen: false,
      connect: jest.fn(() => {
        client.isOpen = true;
        return Promise.resolve();
      }),
      on: jest.fn(),
    };
    jest.doMock("redis", () => ({
      createClient: jest.fn(() => client),
    }));

    const { ensureRedisConnected } = require("../utils/redisClient");
    await Promise.all([ensureRedisConnected(), ensureRedisConnected()]);
    expect(client.connect.mock.calls.length).toBe(1);
  });
});
