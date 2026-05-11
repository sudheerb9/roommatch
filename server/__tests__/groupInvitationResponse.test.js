const { asInvitationResponse } = require("../utils/groupInvitationResponse");

describe("asInvitationResponse", () => {
  const base = {
    id: "7",
    group_id: 2,
    inviter_user_id: 10,
    invitee_user_id: 11,
    status: "pending",
    responded_at: null,
    note: "join us",
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-02"),
  };

  it("maps plain invitation row", () => {
    const out = asInvitationResponse(base);
    expect(out).toMatchObject({
      id: 7,
      group_id: 2,
      inviter_user_id: 10,
      invitee_user_id: 11,
      status: "pending",
      responded_at: null,
      note: "join us",
    });
    expect(typeof out.created_at).not.toBeUndefined();
    expect(typeof out.updated_at).not.toBeUndefined();
  });

  it("unwraps Sequelize model", () => {
    const sequelizeLike = {
      get(opts) {
        expect(opts).toEqual({ plain: true });
        return { ...base, id: String(base.id) };
      },
    };
    const out = asInvitationResponse(sequelizeLike);
    expect(out.id).toBe(7);
  });

  it("includes inviter/invitee and group when nested", () => {
    const out = asInvitationResponse({
      ...base,
      inviter: {
        id: 10,
        email: "a@x.com",
        display_name: "A",
      },
      invitee: {
        id: 11,
        email: "b@x.com",
        display_name: null,
      },
      group: { id: 2, name: "G", status: "open" },
    });
    expect(out.inviter.display_name).toBe("A");
    expect(out.invitee.display_name).toBeNull();
    expect(out.group).toEqual({ id: 2, name: "G", status: "open" });
  });

  it("accepts Sequelize Group casing", () => {
    const out = asInvitationResponse({
      ...base,
      Group: { id: 2, name: "H", status: null },
    });
    expect(out.group).toEqual({ id: 2, name: "H", status: null });
  });
});
