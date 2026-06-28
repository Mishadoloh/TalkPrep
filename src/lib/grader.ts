export interface GradingResult {
  score: number;
  critique: string;
  fillersCount: number;
  wordCount: number;
}

// Map of common keywords to look for based on topics
const KEYWORD_MAP: Record<string, string[]> = {
  "let, const, and var": ["scope", "block", "hoist", "reassign", "redeclare", "temporal dead zone", "tdz", "function"],
  "state and props": ["read-only", "prop", "state", "mutable", "immutable", "parent", "internal", "render"],
  "virtual dom": ["lightweight", "diff", "reconciliation", "real dom", "update", "render", "snapshot"],
  "closure": ["closure", "lexical", "scope", "inner", "outer", "privacy", "encapsulate", "state"],
  "useeffect": ["effect", "side effect", "dependency", "mount", "unmount", "cleanup", "render"],
  "ssr and ssg": ["ssr", "ssg", "server", "build", "dynamic", "static", "cdn", "pre-render"],
  "slow react": ["memo", "re-render", "callback", "usememo", "profile", "virtualize", "lazy", "colocate"],
  "event loop": ["single-threaded", "call stack", "queue", "microtask", "macrotask", "promise", "timeout", "loop"],
  "critical rendering": ["critical", "path", "dom", "cssom", "render tree", "layout", "paint", "blocking"],
  "get and post": ["retrieve", "send", "url", "body", "idempotent", "query", "parameters", "size"],
  "indexing": ["index", "b-tree", "search", "retrieval", "write", "storage", "performance", "speed"],
  "sql injection": ["injection", "parameterize", "prepared", "sanitize", "orm", "malicious", "input", "privilege"],
  "normalization": ["normalize", "denormalize", "redundancy", "joins", "performance", "integrity", "tables"],
  "scaling": ["vertical", "horizontal", "scale out", "scale up", "hardware", "machines", "sharding", "load balancer"],
  "jwt": ["token", "stateless", "cookie", "httponly", "xss", "csrf", "sign", "expiration", "samesite"],
  "acid": ["acid", "atomic", "consistency", "isolation", "durable", "cap", "available", "partition", "transaction"],
  "cache invalidation": ["cache", "invalidate", "ttl", "pub/sub", "redis", "kafka", "evict", "consistency"],
  "rest, graphql, and grpc": ["rest", "graphql", "grpc", "verbs", "query", "types", "protocol", "http/2", "streaming"],
  "cors": ["cors", "origin", "browser", "headers", "access-control", "domain", "security"],
  "cookies differ": ["cookie", "local storage", "httponly", "xss", "csrf", "size", "expiration", "http request"],
  "orm": ["orm", "sql", "object", "database", "model", "query", "abstraction", "performance"],
  "websockets": ["websocket", "persistent", "full-duplex", "polling", "real-time", "latency", "overhead"],
  "xss": ["xss", "csrf", "sanitize", "escape", "token", "httponly", "samesite", "origin", "inject"],
  "nginx": ["proxy", "load balancer", "ssl", "terminate", "cache", "route", "security"],
  "file uploads": ["presign", "s3", "upload", "transcode", "ffmpeg", "bucket", "queue", "worker"],
  "serverless": ["serverless", "faas", "scale", "cold start", "state", "ephemeral", "cost"],
  "distributed transaction": ["saga", "compensating", "orchestrator", "choreography", "event", "distributed", "transaction"],
  "mvp": ["mvp", "viable", "hypotheses", "learning", "effort", "features", "customers"],
  "qualitative and quantitative": ["qualitative", "quantitative", "why", "what", "metrics", "analytics", "interviews", "surveys"],
  "prioritize": ["rice", "moscow", "kano", "priority", "roadmap", "effort", "reach", "impact"],
  "product-market fit": ["pmf", "fit", "disappointed", "sean ellis", "retention", "satisfaction", "growth"],
  "pivot": ["pivot", "strategy", "metrics", "drop-off", "hypothesis", "interviews", "re-allocate"],
  "deprecating": ["deprecate", "usage", "deprecation", "timeline", "transparency", "faq", "stakeholder"]
};

export function gradeAnswer(userAnswer: string, idealAnswer: string, questionText: string): GradingResult {
  const answer = userAnswer.trim();
  
  if (!answer) {
    return {
      score: 0,
      critique: "No answer was recorded. Try speaking clearly into the microphone.",
      fillersCount: 0,
      wordCount: 0,
    };
  }

  // 1. Analyze word count
  const words = answer.split(/\s+/);
  const wordCount = words.length;

  // 2. Count filler words
  const fillers = ["uh", "um", "like", "you know", "sort of", "ah", "well"];
  let fillersCount = 0;
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (fillers.includes(cleanWord)) {
      fillersCount++;
    }
  });

  // 3. Keyword matching based on topic keywords
  const lowercaseAnswer = answer.toLowerCase();
  const lowercaseQuestion = questionText.toLowerCase();
  
  // Find which topic this question matches
  let matchingKeywords: string[] = [];
  for (const [topic, keywords] of Object.entries(KEYWORD_MAP)) {
    if (lowercaseQuestion.includes(topic.toLowerCase()) || topic.toLowerCase().split(" ").some(word => word.length > 3 && lowercaseQuestion.includes(word))) {
      matchingKeywords = keywords;
      break;
    }
  }

  // Fallback keywords from the ideal answer itself
  if (matchingKeywords.length === 0) {
    // extract words > 5 chars from ideal answer as fallback keywords
    const idealWords = idealAnswer.toLowerCase().split(/\s+/);
    const uniqueIdealWords = Array.from(new Set(idealWords))
      .map(w => w.replace(/[^a-z]/g, ""))
      .filter(w => w.length > 5);
    matchingKeywords = uniqueIdealWords.slice(0, 8);
  }

  // Calculate matching keyword percentage
  let matchedCount = 0;
  const missedKeywords: string[] = [];
  
  matchingKeywords.forEach(keyword => {
    if (lowercaseAnswer.includes(keyword)) {
      matchedCount++;
    } else {
      missedKeywords.push(keyword);
    }
  });

  const keywordScore = matchingKeywords.length > 0 ? (matchedCount / matchingKeywords.length) * 100 : 50;

  // 4. Calculate final score
  // Penalize heavily if answer is too short (e.g. less than 15 words)
  let lengthMultiplier = 1;
  if (wordCount < 10) lengthMultiplier = 0.2;
  else if (wordCount < 20) lengthMultiplier = 0.5;
  else if (wordCount < 40) lengthMultiplier = 0.8;
  else if (wordCount > 150) lengthMultiplier = 0.95; // too verbose can also slightly decrease efficiency

  // Deduct slightly for excessive filler usage
  const fillerRate = fillersCount / wordCount;
  let fillerPenalty = 0;
  if (fillerRate > 0.15) fillerPenalty = 15;
  else if (fillerRate > 0.08) fillerPenalty = 8;
  else if (fillerRate > 0.04) fillerPenalty = 3;

  let finalScore = Math.round(keywordScore * lengthMultiplier - fillerPenalty);
  finalScore = Math.max(0, Math.min(100, finalScore));

  // 5. Generate qualitative critique
  let critique = "";
  if (finalScore >= 85) {
    critique = `Excellent response! You explained the concepts clearly, covered key technical requirements, and demonstrated high communication confidence. You used minimal filler words (${fillersCount}).`;
  } else if (finalScore >= 70) {
    critique = `Good solid answer. You hit the main points but could be slightly more structured. `;
    if (missedKeywords.length > 0) {
      critique += `To improve, you could explicitly mention or expand on these key concepts: ${missedKeywords.slice(0, 3).join(", ")}. `;
    }
    if (fillersCount > 3) {
      critique += `Try to reduce your usage of filler words like 'like' or 'um' (${fillersCount} counted) to sound more authoritative.`;
    }
  } else if (finalScore >= 40) {
    critique = `Decent attempt, but your answer is either too brief or misses several critical definitions. `;
    if (missedKeywords.length > 0) {
      critique += `You missed talking about: ${missedKeywords.slice(0, 4).join(", ")}. `;
    }
    critique += `Try to expand on the practical implications of these concepts next time.`;
  } else {
    critique = `This response was too short or off-topic. `;
    if (wordCount < 15) {
      critique += "Answering technical questions usually requires at least 3-4 descriptive sentences (30+ words) to demonstrate depth of knowledge. ";
    }
    critique += "Review the ideal answer provided and try practicing speaking out loud again.";
  }

  return {
    score: finalScore,
    critique,
    fillersCount,
    wordCount,
  };
}
