const { getPagination, buildPaginationMeta } = require("../utils/pagination");

describe("getPagination", () => {
  it("uses defaults for missing query", () => {
    expect(getPagination({})).toEqual({
      page: 1,
      limit: 20,
      offset: 0,
    });
  });

  it("parses page and limit", () => {
    expect(getPagination({ page: "3", limit: "5" })).toEqual({
      page: 3,
      limit: 5,
      offset: 10,
    });
  });

  it("respects maxLimit override", () => {
    expect(
      getPagination({ limit: "9999" }, { limit: 20, maxLimit: 10 }),
    ).toEqual({
      page: 1,
      limit: 10,
      offset: 0,
    });
  });

  it("falls back when page/limit invalid", () => {
    expect(getPagination({ page: "0", limit: "-2" }, { page: 2, limit: 5 }))
      .toEqual({
      page: 2,
      limit: 5,
      offset: 5,
    });
  });
});

describe("buildPaginationMeta", () => {
  it("sets hasMore when count equals limit", () => {
    expect(buildPaginationMeta({ page: 1, limit: 10, count: 10 })).toEqual({
      page: 1,
      limit: 10,
      count: 10,
      hasMore: true,
    });
  });

  it("hasMore false when under page size", () => {
    expect(buildPaginationMeta({ page: 1, limit: 10, count: 3 })).toEqual({
      page: 1,
      limit: 10,
      count: 3,
      hasMore: false,
    });
  });
});
