import { teamTools, handleTeamTool } from "../../src/tools/teams.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

describe("teamTools exports", () => {
  it("exports dataverse_list_teams", () => {
    expect(
      teamTools.find((t) => t.name === "dataverse_list_teams"),
    ).toBeDefined();
  });
});

describe("handleTeamTool", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  describe("dataverse_list_teams", () => {
    it("queries the teams entity set", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      await handleTeamTool("dataverse_list_teams", {}, dvClient());

      expect(mockClient.query).toHaveBeenCalledWith(
        "teams",
        expect.any(Object),
      );
    });

    it("applies teamType filter when provided", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      await handleTeamTool("dataverse_list_teams", { teamType: 0 }, dvClient());

      expect(mockClient.query).toHaveBeenCalledWith(
        "teams",
        expect.objectContaining({ filter: "teamtype eq 0" }),
      );
    });

    it("applies teamType filter for Security (type 3)", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      await handleTeamTool("dataverse_list_teams", { teamType: 3 }, dvClient());

      expect(mockClient.query).toHaveBeenCalledWith(
        "teams",
        expect.objectContaining({ filter: "teamtype eq 3" }),
      );
    });

    it("omits filter when teamType not provided", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      await handleTeamTool("dataverse_list_teams", {}, dvClient());

      const callArgs = mockClient.query!.mock.calls[0]![1] as Record<
        string,
        unknown
      >;
      expect(callArgs["filter"]).toBeUndefined();
    });

    it("defaults top to 50", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      await handleTeamTool("dataverse_list_teams", {}, dvClient());

      expect(mockClient.query).toHaveBeenCalledWith(
        "teams",
        expect.objectContaining({ top: 50 }),
      );
    });

    it("respects a provided top value", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      await handleTeamTool("dataverse_list_teams", { top: 100 }, dvClient());

      expect(mockClient.query).toHaveBeenCalledWith(
        "teams",
        expect.objectContaining({ top: 100 }),
      );
    });

    it("rejects top > 200", async () => {
      await expect(
        handleTeamTool("dataverse_list_teams", { top: 201 }, dvClient()),
      ).rejects.toThrow();
    });

    it("returns mapped shape with teamTypeName", async () => {
      mockClient.query!.mockResolvedValue({
        value: [
          {
            teamid: "aaa-111",
            name: "Owners Team",
            teamtype: 0,
            description: null,
            isdefault: true,
            createdon: "2024-01-01T00:00:00Z",
          },
          {
            teamid: "bbb-222",
            name: "AAD Security Group",
            teamtype: 3,
            description: "AD-backed group",
            isdefault: false,
            createdon: "2024-01-02T00:00:00Z",
          },
        ],
        "@odata.context": "test",
      });

      const result = await handleTeamTool(
        "dataverse_list_teams",
        {},
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        teams: Array<{ teamid: string; name: string; teamTypeName: string }>;
        count: number;
      };
      expect(parsed.count).toBe(2);
      expect(parsed.teams[0]!.teamTypeName).toBe("Owner");
      expect(parsed.teams[1]!.teamTypeName).toBe("Security");
    });

    it("returns count 0 and empty teams array when no results", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test",
      });

      const result = await handleTeamTool(
        "dataverse_list_teams",
        {},
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        teams: unknown[];
        count: number;
      };
      expect(parsed.count).toBe(0);
      expect(parsed.teams).toHaveLength(0);
    });

    it("uses Unknown for unrecognised teamtype values", async () => {
      mockClient.query!.mockResolvedValue({
        value: [
          {
            teamid: "ccc-333",
            name: "Mystery Team",
            teamtype: 99,
            isdefault: false,
          },
        ],
        "@odata.context": "test",
      });

      const result = await handleTeamTool(
        "dataverse_list_teams",
        {},
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        teams: Array<{ teamTypeName: string }>;
      };
      expect(parsed.teams[0]!.teamTypeName).toBe("Unknown");
    });
  });
});
