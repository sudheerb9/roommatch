jest.mock("../models", () => ({
  HousingUnit: { findAll: jest.fn(), count: jest.fn() },
}));

jest.mock("../services/matchingService", () => ({
  getMatchedUsersForUser: jest.fn().mockResolvedValue([]),
  isMatchingEligible: jest.fn().mockResolvedValue(true),
}));

const { HousingUnit } = require("../models");
const matchingService = require("../services/matchingService");
const { listHousingUnits } = require("../controllers/housingController");
const { getMatches } = require("../controllers/matchesController");

function resMock() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("housingController", () => {
  beforeEach(() => {
    HousingUnit.findAll.mockResolvedValueOnce([]);
    HousingUnit.count.mockResolvedValueOnce(0);
  });

  it("returns paginated payloads", async () => {
    const req = {
      query: { available: "true", limit: "2", page: "1" },
    };
    const res = resMock();
    await listHousingUnits(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.any(Object),
        total: expect.any(Number),
      }),
    );
  });

  it("honors negative availability filters", async () => {
    HousingUnit.findAll.mockResolvedValueOnce([]);
    HousingUnit.count.mockResolvedValueOnce(0);
    const res = resMock();
    await listHousingUnits({ query: { available: "false" } }, res, jest.fn());
    expect(HousingUnit.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { is_available: false },
      }),
    );
  });

  it("propagates storage errors upward", async () => {
    HousingUnit.findAll.mockReset();
    HousingUnit.count.mockReset();
    HousingUnit.findAll.mockRejectedValueOnce(new Error("boom"));
    const next = jest.fn();
    await listHousingUnits({ query: {} }, resMock(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("matchesController", () => {
  it("responds with empty payloads when matcher flags ineligible viewers", async () => {
    matchingService.isMatchingEligible.mockResolvedValueOnce(false);
    const res = resMock();
    await getMatches({ user: { id: 1 }, query: {} }, res, jest.fn());
    expect(matchingService.getMatchedUsersForUser).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
        meta: expect.objectContaining({ matching_eligible: false }),
      }),
    );
  });

  it("pipes eligible payloads through paging helpers", async () => {
    matchingService.isMatchingEligible.mockResolvedValueOnce(true);
    matchingService.getMatchedUsersForUser.mockResolvedValueOnce([]);
    await getMatches({ user: { id: 88 }, query: { limit: "5" } }, resMock(), jest.fn());

    expect(matchingService.getMatchedUsersForUser).toHaveBeenCalled();
  });

  it("surfaces datastore failures cleanly", async () => {
    matchingService.isMatchingEligible.mockRejectedValueOnce(new Error("no redis"));
    const next = jest.fn();
    await getMatches({ user: { id: 1 }, query: {} }, resMock(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
