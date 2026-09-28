import { MongoClient, type Db } from "mongodb";
import type {
  Award,
  Campaign,
  CampaignRun,
  Deposit,
  Player,
  Round,
  Session,
} from "../domain/models.js";
export function collections(db: Db) {
  return {
    players: db.collection<Player>("players"),
    campaigns: db.collection<Campaign>("campaigns"),
    campaignRuns: db.collection<CampaignRun>("campaignRuns"),
    awards: db.collection<Award>("awards"),
    deposits: db.collection<Deposit>("deposits"),
    sessions: db.collection<Session>("sessions"),
    rounds: db.collection<Round>("gameRounds"),
  };
}
export async function initializeDatabase(client: MongoClient, db: Db) {
  await client.connect();
  const hello = await db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid")
    throw new Error(
      "MongoDB must be a replica set or Atlas deployment for atomic balance transactions.",
    );
  const c = collections(db);
  await Promise.all([
    c.players.createIndex({ createdAt: -1 }),
    c.players.createIndex({ status: 1, tags: 1 }),
    c.rounds.createIndex({ playerId: 1, requestId: 1 }, { unique: true }),
    c.rounds.createIndex({ createdAt: -1 }),
    c.deposits.createIndex({ requestId: 1 }, { unique: true }),
    c.awards.createIndex({ type: 1, status: 1, "targetRound.endsAt": 1 }),
    c.awards.createIndex({ requestId: 1 }, { unique: true }),
    c.awards.createIndex({ playerId: 1, status: 1, createdAt: 1 }),
    c.awards.createIndex(
      { campaignId: 1, issuanceId: 1, playerId: 1 },
      {
        unique: true,
        partialFilterExpression: { issuanceId: { $type: "string" } },
      },
    ),
    c.sessions.createIndex({ playerId: 1, createdAt: 1 }),
    c.campaigns.createIndex({ createdAt: -1 }),
    c.campaignRuns.createIndex({ campaignId: 1, createdAt: -1 }),
  ]);
  // Replace the old once-per-campaign constraint after the per-run index exists.
  // Existing award documents remain unchanged.
  try {
    await c.awards.dropIndex("campaignId_1_playerId_1");
  } catch (error) {
    if ((error as { code?: number }).code !== 27) throw error;
  }
}
