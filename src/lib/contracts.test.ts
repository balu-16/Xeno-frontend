import { describe, it, expect } from "vitest";
import {
  channelSchema,
  campaignStatusSchema,
  segmentConditionSchema,
  segmentRuleGroupSchema,
  paginationQuerySchema,
  aiToolNameSchema,
} from "./contracts";

describe("channelSchema", () => {
  it.each(["WHATSAPP", "SMS", "EMAIL", "RCS"] as const)(
    "accepts %s",
    (channel) => {
      expect(channelSchema.parse(channel)).toBe(channel);
    },
  );

  it("rejects invalid channel", () => {
    const result = channelSchema.safeParse("INVALID");
    expect(result.success).toBe(false);
  });
});

describe("campaignStatusSchema", () => {
  it.each(["DRAFT", "QUEUED", "RUNNING", "COMPLETED", "FAILED"] as const)(
    "accepts %s",
    (status) => {
      expect(campaignStatusSchema.parse(status)).toBe(status);
    },
  );

  it("rejects unknown status", () => {
    const result = campaignStatusSchema.safeParse("UNKNOWN");
    expect(result.success).toBe(false);
  });
});

describe("segmentConditionSchema", () => {
  it("accepts numeric field with number value", () => {
    const result = segmentConditionSchema.safeParse({
      field: "totalSpent",
      operator: ">",
      value: 500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts city with string value and contains operator", () => {
    const result = segmentConditionSchema.safeParse({
      field: "city",
      operator: "contains",
      value: "New York",
    });
    expect(result.success).toBe(true);
  });

  it("rejects numeric field with string value", () => {
    const result = segmentConditionSchema.safeParse({
      field: "totalSpent",
      operator: ">",
      value: "500",
    });
    expect(result.success).toBe(false);
  });

  it("rejects city with number value", () => {
    const result = segmentConditionSchema.safeParse({
      field: "city",
      operator: "contains",
      value: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects contains operator on non-city field", () => {
    const result = segmentConditionSchema.safeParse({
      field: "totalSpent",
      operator: "contains",
      value: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("segmentRuleGroupSchema", () => {
  it("accepts valid AND group with conditions", () => {
    const result = segmentRuleGroupSchema.safeParse({
      operator: "AND",
      conditions: [
        { field: "totalSpent", operator: ">", value: 500 },
        { field: "orderCount", operator: ">=", value: 3 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid nested OR group", () => {
    const result = segmentRuleGroupSchema.safeParse({
      operator: "OR",
      conditions: [
        { field: "city", operator: "contains", value: "York" },
        {
          operator: "AND",
          conditions: [{ field: "totalSpent", operator: ">", value: 1000 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects nesting deeper than 3 levels", () => {
    const result = segmentRuleGroupSchema.safeParse({
      operator: "AND",
      conditions: [
        {
          operator: "OR",
          conditions: [
            {
              operator: "AND",
              conditions: [
                {
                  operator: "OR",
                  conditions: [
                    { field: "totalSpent", operator: ">", value: 100 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("paginationQuerySchema", () => {
  it("applies default page=1 and pageSize=20", () => {
    const result = paginationQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("coerces string values to numbers", () => {
    const result = paginationQuerySchema.parse({
      page: "3",
      pageSize: "50",
    });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });
});

describe("aiToolNameSchema", () => {
  it.each([
    "getDashboardMetrics",
    "getCampaignPerformance",
    "generateSegmentRules",
    "generateCampaignMessage",
    "recommendAudience",
    "diagnoseCampaignFailure",
    "listSegments",
    "listCampaigns",
    "getCustomerStats",
    "getBestSendTime",
    "suggestABTest",
  ] as const)("accepts %s", (tool) => {
    expect(aiToolNameSchema.parse(tool)).toBe(tool);
  });

  it("rejects unknown tool name", () => {
    const result = aiToolNameSchema.safeParse("unknownTool");
    expect(result.success).toBe(false);
  });
});
