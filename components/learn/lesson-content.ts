import type { ComponentType } from "react";
import WhatIsLocalAi from "./content/what-is-local-ai";
import Memory from "./content/memory";
import ModelSize from "./content/model-size";
import Quantization from "./content/quantization";
import FitsVsFast from "./content/fits-vs-fast";
import Context from "./content/context";
import Speed from "./content/speed";
import ChatVsAgents from "./content/chat-vs-agents";
import Formats from "./content/formats";
import FirstModel from "./content/first-model";

/** Lesson bodies by slug. Metadata lives in ./lessons.ts. */
export const LESSON_CONTENT: Record<string, ComponentType> = {
  "what-is-local-ai": WhatIsLocalAi,
  memory: Memory,
  "model-size": ModelSize,
  quantization: Quantization,
  "fits-vs-fast": FitsVsFast,
  context: Context,
  speed: Speed,
  "chat-vs-agents": ChatVsAgents,
  formats: Formats,
  "first-model": FirstModel,
};
