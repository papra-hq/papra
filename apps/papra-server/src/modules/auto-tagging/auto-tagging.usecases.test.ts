import { describe, expect, test, vi } from "vitest";
import * as v from "valibot";
import { createInMemoryDatabase } from "../app/database/database.test-utils";
import { createTestEventServices } from "../app/events/events.test-utils";
import type { AiServices } from "../ai/ai.services";
import { overrideConfig } from "../config/config.test-utils";
import { createTestLogger } from "../shared/logger/logger.test-utils";
import { createTagsRepository } from "../tags/tags.repository";
import { documentsTagsTable, tagsTable } from "../tags/tags.table";
import { applyTagsToDocuments, createTag } from "../tags/tags.usecases";
import {
  buildApplyAutoTaggingActions,
  buildPromptForAutoTagging,
} from "./auto-tagging.usecases";
import type { AutoTaggingResponse } from "./auto-tagging.models";
import {
  buildAutoTaggingSystemPrompt,
  buildAutoTaggingUserPrompt,
} from "./auto-tagging.models";

function createTestResolveOrganizationSettings(
  autoTagging: Partial<{
    isEnabled: boolean;
    canCreateNewTags: boolean;
    maxTags: number;
  }> = {},
): ResolveOrganizationSettingsUsecase {
  return async () => ({
    organizationSettings: {
      ai: {
        autoTagging: {
          isEnabled: true,
          canCreateNewTags: false,
          maxTags: 5,
          modelId: "gpt-4",
          ...autoTagging,
        },
        extraction: {
          isEnabled: false,
          extractDate: true,
          extractCustomProperties: true,
          renameDocuments: false,
          filenamePattern: "",
          modelId: "gpt-4",
        },
      },
    },
  });
}

function createTestAiServices({ response }: { response: AutoTaggingResponse }) {
  const generateStructuredData = vi
    .fn<AiServices["generateStructuredData"]>()
    .mockResolvedValue(response);

  return {
    aiServices: { generateStructuredData } as AiServices,
    generateStructuredData,
  };
}

async function createTestDeps(
  seedOptions: Parameters<typeof createInMemoryDatabase>[0],
  config = overrideConfig(),
) {
  const { db } = await createInMemoryDatabase(seedOptions);
  const tagsRepository = createTagsRepository({ db });
  const eventServices = createTestEventServices();
  const { logger } = createTestLogger();

  return {
    db,
    tagsRepository,
    eventServices,
    logger,
    applyAutoTaggingActions: buildApplyAutoTaggingActions({
      createTag: async (args) => createTag({ ...args, config, tagsRepository }),
      applyTagsToDocuments: async (args) =>
        applyTagsToDocuments({
          ...args,
          tagsRepository,
          eventServices,
          logger,
        }),
    }),
  };
}

const baseDocument = {
  id: "doc_1",
  organizationId: "org_1",
  name: "Doc 1",
  originalName: "Doc 1",
  originalStorageKey: "doc_1",
  originalSha256Hash: "doc_1",
  mimeType: "text/plain",
  content: "Some document content",
};

const financeTag = {
  id: "tag_1",
  name: "Finance",
  normalizedName: "finance",
  color: "#000000",
  organizationId: "org_1",
};

const householdTag = {
  id: "tag_2",
  name: "Household",
  normalizedName: "household",
  color: "#000000",
  organizationId: "org_1",
};

const documentIds = { documentId: "doc_1", organizationId: "org_1" };

const seed = {
  organizations: [{ id: "org_1", name: "Org 1" }],
  documents: [baseDocument],
  tags: [financeTag, householdTag],
};

describe("auto-tagging usecases", () => {
  describe("buildPromptForAutoTagging", () => {
    test("analysis uses the existing prompts and accounting source and returns bounded tag actions without applying them", async () => {
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          existingTags: ["Finance", "Finance", "Unknown"],
          newTags: [
            { name: "Invoice", description: "Invoices and receipts" },
            { name: "Other" },
          ],
        },
      });
      const promptForAutoTagging = buildPromptForAutoTagging({ aiServices });
      const options = {
        existingTags: seed.tags,
        canCreateNewTags: true,
        maxTags: 2,
      };

      expect(
        await promptForAutoTagging({
          document: baseDocument,
          modelId: "openai://gpt-4",
          ...options,
        }),
      ).toEqual({
        tagIdsToAdd: ["tag_1"],
        tagsToCreate: [
          { name: "Invoice", description: "Invoices and receipts" },
        ],
      });
      expect(generateStructuredData).toHaveBeenCalledTimes(1);
      const [request] = generateStructuredData.mock.calls[0]!;
      expect(request).toMatchObject({
        organizationId: "org_1",
        modelId: "openai://gpt-4",
        source: "auto-tagging",
        systemPrompt: buildAutoTaggingSystemPrompt(options),
        userPrompt: buildAutoTaggingUserPrompt({ document: baseDocument }),
      });
      expect(
        v.safeParse(request.schema!, { existingTags: ["Finance"], newTags: [] })
          .success,
      ).toEqual(true);
      expect(
        v.safeParse(request.schema!, { existingTags: ["Unknown"], newTags: [] })
          .success,
      ).toEqual(false);
    });
  });

  describe("buildApplyAutoTaggingActions", () => {
    test("existing and successfully created tags are applied despite a creation failure, preserving current tags and emitting the domain event", async () => {
      const deps = await createTestDeps(seed);
      await deps.db
        .insert(documentsTagsTable)
        .values({ documentId: "doc_1", tagId: "tag_2" });

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: ["tag_1"],
        tagsToCreate: [
          { name: "Finance" },
          { name: "Invoice", description: "Invoices and receipts" },
        ],
      });

      const tags = await deps.db.select().from(tagsTable);
      expect(tags.length).toEqual(3);
      const invoiceTag = tags.find((tag) => tag.name === "Invoice")!;
      expect(invoiceTag).toMatchObject({
        description: "Invoices and receipts",
        color: "#CCCCCC",
        organizationId: "org_1",
      });
      const documentTags = await deps.db.select().from(documentsTagsTable);
      expect(documentTags.map(({ tagId }) => tagId).sort()).toEqual(
        ["tag_1", "tag_2", invoiceTag.id].sort(),
      );
      expect(deps.eventServices.getEmittedEvents()).toEqual([
        {
          eventName: "document.tags.changed",
          payload: {
            organizationId: "org_1",
            userId: undefined,
            addedPairs: [
              { documentId: "doc_1", tagId: "tag_1", tagName: "Finance" },
              { documentId: "doc_1", tagId: invoiceTag.id, tagName: "Invoice" },
            ],
            removedPairs: [],
          },
        },
      ]);
    });

    test("the organization tag limit prevents new tags without preventing existing tags from being applied", async () => {
      const deps = await createTestDeps(
        seed,
        overrideConfig({ tags: { maxTagsPerOrganization: 2 } }),
      );

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: ["tag_1"],
        tagsToCreate: [{ name: "Invoice" }],
      });

      expect((await deps.db.select().from(tagsTable)).length).toEqual(2);
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: "doc_1", tagId: "tag_1" },
      ]);
    });

    test("empty actions leave existing tags untouched and emit no event", async () => {
      const deps = await createTestDeps(seed);
      await deps.db
        .insert(documentsTagsTable)
        .values({ documentId: "doc_1", tagId: "tag_2" });

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: [],
        tagsToCreate: [],
      });

      expect((await deps.db.select().from(tagsTable)).length).toEqual(2);
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: "doc_1", tagId: "tag_2" },
      ]);
      expect(deps.eventServices.getEmittedEvents()).toEqual([]);
    });
  });
});
