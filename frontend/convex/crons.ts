import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 30 minutes — abandon rooms older than 3 hours with no activity
crons.interval(
  "abandon-expired-rooms",
  { minutes: 30 },
  internal.rooms.abandonExpiredRooms,
);

export default crons;
