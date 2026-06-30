export interface QuestionTemplate {
  questionText: string;
  idealAnswer: string;
}

export const QUESTION_BANK: Record<string, Record<string, QuestionTemplate[]>> = {
  "Frontend Engineer": {
    "Junior": [
      {
        questionText: "What is the difference between let, const, and var in JavaScript?",
        idealAnswer: "var is function-scoped, can be redeclared, and is hoisted with undefined. let and const are block-scoped, cannot be redeclared in the same scope, and are not initialized during hoisting (Temporal Dead Zone). const variables must be initialized and cannot be reassigned, though their properties can be mutated."
      },
      {
        questionText: "Explain the difference between state and props in React.",
        idealAnswer: "Props are read-only configuration parameters passed down from a parent component, making components reusable. State is a private, mutable data structure managed internally within a component that triggers a re-render when updated via state setters."
      },
      {
        questionText: "What is the Virtual DOM and how does React use it to render pages?",
        idealAnswer: "The Virtual DOM is a lightweight JavaScript representation of the real DOM. When state changes, React updates this virtual tree, compares it with the previous snapshot (diffing algorithm), and bats updates to make minimal modifications to the real DOM (reconciliation)."
      }
    ],
    "Mid": [
      {
        questionText: "What is a closure in JavaScript and can you give a common use case?",
        idealAnswer: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). It allows an inner function to access variables from an outer function scope even after the outer function has returned. Common use cases include data privacy (encapsulation), callbacks, and function factories."
      },
      {
        questionText: "How does React's useEffect hook work, and how do you clean up side effects?",
        idealAnswer: "useEffect lets you perform side effects in functional components. It runs after render. The second argument is a dependency array. If empty, it runs once after mount. If values change, it re-runs. Returning a function from the hook serves as the cleanup callback, which runs before the component unmounts or before the next effect run."
      },
      {
        questionText: "Explain the difference between Server-Side Rendering (SSR) and Static Site Generation (SSG).",
        idealAnswer: "SSR generates HTML dynamically on the server for each request, ensuring up-to-date data at the cost of server overhead. SSG pre-renders the HTML during the build process, allowing pages to be served instantly via CDNs, which is fast but requires rebuilding the site for content updates."
      }
    ],
    "Senior": [
      {
        questionText: "How would you optimize a slow React application that suffers from excessive re-renders?",
        idealAnswer: "First, profile using React DevTools. Apply React.memo to prevent unnecessary component re-renders. Use useMemo and useCallback to memoize heavy computations and reference-type props. Implement virtualized lists (like react-window) for large tables. State colocation, debouncing inputs, and lazy loading modules using dynamic imports are also key strategies."
      },
      {
        questionText: "Explain how JavaScript handles asynchronous operations using the Event Loop, Call Stack, Microtask queue, and Macrotask queue.",
        idealAnswer: "JavaScript is single-threaded. Synchronous code executes in the Call Stack. Async operations (timeouts, network fetches) are handled by APIs and put into queues. The microtask queue (Promise callbacks, MutationObservers) has higher priority. The macrotask queue (setTimeout, setInterval, I/O) has lower priority. Once the Call Stack is empty, the Event Loop processes all microtasks, updates the rendering loop, and then handles one macrotask, repeating continuously."
      },
      {
        questionText: "What is the critical rendering path in a browser and how do you optimize it?",
        idealAnswer: "The critical rendering path is the sequence of steps the browser takes to convert HTML, CSS, and JS into pixels: parsing HTML into DOM, CSS into CSSOM, combining them into the Render Tree, calculating Layout, and Painting. Optimize by minifying assets, leveraging caching, deferring non-critical JavaScript, inlining critical CSS, using async/defer flags, and avoiding render-blocking stylesheets."
      }
    ]
  },
  "Backend Engineer": {
    "Junior": [
      {
        questionText: "What is the difference between GET and POST HTTP requests?",
        idealAnswer: "GET is used to retrieve data from a server, appends parameters to the URL query string, has length limitations, and should be idempotent and safe. POST is used to send data to a server to create/update resources, transmits data in the request body, has no size limit, and is not idempotent."
      },
      {
        questionText: "Explain the concept of database indexing and its trade-offs.",
        idealAnswer: "An index is a data structure (like a B-Tree) that improves data retrieval speed on specific columns in a database table. The trade-off is that indexes consume additional storage space and slow down write operations (INSERT, UPDATE, DELETE) because the index must be updated."
      },
      {
        questionText: "What are SQL injections and how do you prevent them?",
        idealAnswer: "SQL injection is a vulnerability where malicious SQL statements are inserted into inputs to execute unintended queries. Prevent it by using parameterized queries (prepared statements), sanitizing and validating user inputs, using ORMs, and enforcing the principle of least privilege on database accounts."
      }
    ],
    "Mid": [
      {
        questionText: "What is database normalization and when would you denormalize a database?",
        idealAnswer: "Normalization organizes database schemas to reduce redundancy and dependency (e.g. 1NF, 2NF, 3NF). You denormalize a database to improve read performance in read-heavy applications, reducing expensive JOIN queries by storing pre-aggregated or duplicated data, at the cost of integrity checks on updates."
      },
      {
        questionText: "Explain the difference between horizontal and vertical database scaling.",
        idealAnswer: "Vertical scaling (scaling up) means adding more power (CPU, RAM, SSD) to an existing server, which is simple but has hardware limits. Horizontal scaling (scaling out) means adding more machines, distributing traffic via replication, sharding, or load balancers, which is complex but offers theoretical infinite scaling."
      },
      {
        questionText: "What is JWT (JSON Web Token) authentication and how do you secure it?",
        idealAnswer: "JWT is a stateless authentication mechanism where user session details are encoded in a signed JSON token. Secure it by signing with strong HS256/RS256 algorithms, setting appropriate expiration times, storing it in HttpOnly SameSite Secure cookies to prevent XSS and CSRF, and using a token revocation list if necessary."
      }
    ],
    "Senior": [
      {
        questionText: "Explain ACID properties in relational databases and how they differ from the CAP theorem in distributed systems.",
        idealAnswer: "ACID ensures transaction reliability: Atomicity (all or nothing), Consistency (valid state transitions), Isolation (independent concurrent runs), and Durability (permanently saved). CAP theorem states a distributed system can guarantee at most two of: Consistency (all nodes see same data), Availability (every request receives a response), and Partition Tolerance (system functions during network splits). ACID is database-specific consistency, while CAP is about trade-offs under network failures in distributed nodes."
      },
      {
        questionText: "How would you design a distributed cache invalidation strategy for a high-traffic microservices architecture?",
        idealAnswer: "Implement a hybrid strategy. Use cache-aside (lazy loading) for general data, with low TTLs (Time-to-Live). For events causing state changes, broadcast invalidation messages via a publish-subscribe broker (like Redis Pub/Sub or Kafka) so services invalidate local caches. Use write-through caching where consistency is critical. Apply versioning to cached keys to avoid concurrent write stampedes, and lock access using single-flight patterns."
      },
      {
        questionText: "Describe the architectural difference between REST, GraphQL, and gRPC, and their typical use cases.",
        idealAnswer: "REST is resource-based, uses standard HTTP verbs, has stateless payloads, and is great for general public APIs. GraphQL uses a single endpoint where clients specify exactly what data they need, preventing over-fetching, ideal for complex frontend dashboards. gRPC is contract-first, uses Protocol Buffers and HTTP/2, enables low-latency streaming and typed requests, making it ideal for internal microservice-to-microservice communication."
      }
    ]
  },
  "Fullstack Engineer": {
    "Junior": [
      {
        questionText: "What is CORS (Cross-Origin Resource Sharing) and why do browsers enforce it?",
        idealAnswer: "CORS is a security mechanism enforced by browsers that restricts web pages from making requests to a different domain than the one that served the page. It prevents malicious scripts on one site from accessing sensitive data on another site without explicit permission headers (like Access-Control-Allow-Origin)."
      },
      {
        questionText: "How do cookies differ from local storage in terms of security and usage?",
        idealAnswer: "Cookies are sent automatically with HTTP requests, support HttpOnly and Secure flags preventing client-side script reads (XSS protection), and are capped at 4KB. Local storage is strictly client-side, accessible by JavaScript, holds up to 5MB, does not expire automatically, and is vulnerable to XSS theft."
      },
      {
        questionText: "What is an ORM (Object-Relational Mapping) and why would you use one?",
        idealAnswer: "An ORM is a tool that allows developers to interact with a database using their programming language's objects instead of writing raw SQL. It speeds up development, provides database independence, and handles basic SQL injection protection automatically, though it can introduce performance issues for complex queries."
      }
    ],
    "Mid": [
      {
        questionText: "Explain the concept of WebSockets and how they differ from standard HTTP polling.",
        idealAnswer: "WebSockets establish a persistent, full-duplex TCP connection between the client and server, allowing real-time bi-directional data flow with low overhead. HTTP polling requires the client to repeatedly send HTTP requests to check for updates, which introduces high latency and HTTP header overhead."
      },
      {
        questionText: "How do you protect a fullstack application against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)?",
        idealAnswer: "XSS: sanitize and escape user inputs before rendering, use Content Security Policy (CSP) headers, and store session tokens in HttpOnly cookies. CSRF: use anti-CSRF tokens for forms/requests, validate Origin/Referer headers, and enforce SameSite=Lax/Strict flags on session cookies."
      },
      {
        questionText: "What is the role of a reverse proxy like Nginx or cloud load balancers in fullstack deployments?",
        idealAnswer: "A reverse proxy sits in front of backend servers to route incoming requests, balance load across multiple server instances, handle SSL termination, cache static assets, rate limit traffic, and hide internal server architectures to improve security."
      }
    ],
    "Senior": [
      {
        questionText: "Describe how you would design and deploy a system that handles large file uploads (e.g., videos) and asynchronous transcoding.",
        idealAnswer: "Client requests a presigned upload URL from the API. The client uploads directly to object storage (like AWS S3) to bypass backend servers. Upon complete upload, S3 triggers an event notification (e.g., SQS queue). A backend microservice or worker pool consumes the queue, processes transcoding asynchronously using FFmpeg, saves metadata to the DB, and notifies the client via WebSockets or Webhook upon completion."
      },
      {
        questionText: "What is Serverless architecture, and what are its pros, cons, and architectural challenges?",
        idealAnswer: "Serverless (FaaS) runs code in ephemeral, event-driven containers managed by cloud providers. Pros include automatic scaling, zero server maintenance, and pay-per-execution billing. Cons include cold starts, vendor lock-in, state statelessness, and debug complexity. Key challenges are managing connection pooling (like RDS Proxy) and orchestrating multiple functions without state bottlenecks."
      },
      {
        questionText: "Explain how you would implement a distributed transaction across multiple databases (e.g., Sagas pattern).",
        idealAnswer: "Since distributed locks (2PC) cause low availability, use the Saga pattern. A Saga is a sequence of local transactions. Each transaction updates the database and triggers the next step via messages. If a step fails, the Saga runs compensating transactions in reverse order to undo the changes. Implement this using an Orchestrator (centralized state engine) or Choreography (event-driven routing)."
      }
    ]
  },
  "Product Manager": {
    "Junior": [
      {
        questionText: "How do you define a MVP (Minimum Viable Product)?",
        idealAnswer: "An MVP is the version of a new product that allows a team to collect the maximum amount of validated learning about customers with the least effort. It focuses on testing core hypotheses rather than building polished features."
      },
      {
        questionText: "What is the difference between qualitative and quantitative product research?",
        idealAnswer: "Qualitative research focuses on 'why' users behave a certain way, gathered via interviews, usability testing, and observations. Quantitative research focuses on 'what' is happening, gathered via analytics metrics, surveys, A/B testing, and usage data."
      }
    ],
    "Mid": [
      {
        questionText: "How do you prioritize a product roadmap? What frameworks do you use?",
        idealAnswer: "I prioritize roadmap items by aligning them with business goals. I use frameworks like RICE (Reach, Impact, Confidence, Effort) to assign objective scores, MoSCoW (Must have, Should have, Could have, Won't have) for scope management, or the Kano Model to evaluate customer satisfaction vs functionality."
      },
      {
        questionText: "What is product-market fit (PMF) and how do you measure it?",
        idealAnswer: "PMF is when a product satisfies a strong market demand. Measure it using the Sean Ellis survey question (how disappointed would users be if the product disappeared; >40% 'very disappointed' indicates fit), high user retention rates over time, organic referral growth, and strong customer lifetime value relative to acquisition costs."
      }
    ],
    "Senior": [
      {
        questionText: "Describe a time when you had to make a pivot in product strategy based on conflicting data.",
        idealAnswer: "A pivot is required when quantitative metrics (e.g., drop in acquisition or retention) conflict with qualitative expectations. Analyze customer drop-off paths, run user interviews to identify hidden friction or mismatched value propositions, formulate a new hypothesis, design a minimal test loop, and redirect engineering resources to the new target value metric."
      },
      {
        questionText: "How do you manage stakeholders when deprecating a popular feature or product?",
        idealAnswer: "First, perform an impact analysis to determine actual feature usage. Communicate transparently with stakeholders early, explaining the 'why' (e.g., technical debt, resource reallocation to higher value). Provide a clear timeline, offering transition plans or alternative features. Support customer success teams with FAQs, and monitor customer sentiment closely during deprecation phases."
      }
    ]
  }
};

export function getRandomQuestions(role: string, level: string, count = 3): QuestionTemplate[] {
  const roleBank = QUESTION_BANK[role] || QUESTION_BANK["Frontend Engineer"];
  const levelBank = roleBank[level] || roleBank["Mid"];
  
  // Shuffle and pick `count` questions
  const shuffled = [...levelBank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
