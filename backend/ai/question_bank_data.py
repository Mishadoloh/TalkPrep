ROLES = [
    ("Frontend Engineer", "frontend-розробника"),
    ("Backend Engineer", "backend-розробника"),
    ("Fullstack Engineer", "fullstack-розробника"),
    ("QA Engineer", "QA-інженера"),
    ("Mobile Engineer", "mobile-розробника"),
    ("DevOps Engineer", "DevOps-інженера"),
    ("Cloud Architect", "cloud-архітектора"),
    ("ML Engineer", "ML-інженера"),
    ("Data Engineer", "data-інженера"),
    ("Security Engineer", "security-інженера"),
    ("Blockchain Engineer", "blockchain-розробника"),
    ("Game Developer", "game developer"),
    ("Embedded Engineer", "embedded-інженера"),
    ("Product Manager", "product manager"),
    ("UI/UX Designer", "UI/UX-дизайнера"),
    ("Data Analyst", "data analyst"),
]

LEVELS = [
    ("Junior", "Junior"),
    ("Mid", "Middle"),
    ("Senior", "Senior"),
]

TOPICS = [
    ("Algorithms", "алгоритми", ("complexity", "edge cases", "trade-offs"), ("складність", "крайові випадки", "компроміси")),
    ("Data Structures", "структури даних", ("arrays", "hash maps", "trees"), ("масиви", "хеш-таблиці", "дерева")),
    ("System Design", "system design", ("requirements", "bottlenecks", "scaling"), ("вимоги", "вузькі місця", "масштабування")),
    ("Databases", "бази даних", ("indexes", "transactions", "schema design"), ("індекси", "транзакції", "дизайн схеми")),
    ("SQL", "SQL", ("joins", "aggregations", "query plans"), ("join", "агрегації", "плани запитів")),
    ("NoSQL", "NoSQL", ("documents", "partitioning", "eventual consistency"), ("документи", "партиціювання", "eventual consistency")),
    ("Caching", "кешування", ("TTL", "invalidation", "stampedes"), ("TTL", "інвалідація", "cache stampede")),
    ("HTTP APIs", "HTTP API", ("status codes", "idempotency", "pagination"), ("status codes", "ідемпотентність", "пагінація")),
    ("Authentication", "автентифікація", ("sessions", "JWT", "refresh tokens"), ("сесії", "JWT", "refresh tokens")),
    ("Security", "безпека", ("threat modeling", "validation", "least privilege"), ("threat modeling", "валідація", "least privilege")),
    ("Testing", "тестування", ("unit tests", "integration tests", "mocks"), ("unit tests", "integration tests", "mocks")),
    ("CI/CD", "CI/CD", ("pipelines", "rollbacks", "quality gates"), ("pipelines", "rollbacks", "quality gates")),
    ("Observability", "observability", ("logs", "metrics", "traces"), ("логи", "метрики", "трейси")),
    ("Performance", "продуктивність", ("profiling", "latency", "throughput"), ("профілювання", "latency", "throughput")),
    ("Concurrency", "конкурентність", ("race conditions", "locks", "queues"), ("race conditions", "locks", "queues")),
    ("Distributed Systems", "distributed systems", ("consistency", "availability", "retries"), ("consistency", "availability", "retries")),
    ("Frontend Rendering", "frontend rendering", ("hydration", "bundles", "browser rendering"), ("hydration", "bundles", "browser rendering")),
    ("React", "React", ("state", "effects", "memoization"), ("state", "effects", "memoization")),
    ("Next.js", "Next.js", ("routing", "server components", "data fetching"), ("routing", "server components", "data fetching")),
    ("Node.js", "Node.js", ("event loop", "streams", "backpressure"), ("event loop", "streams", "backpressure")),
    ("Python", "Python", ("typing", "async IO", "packaging"), ("typing", "async IO", "packaging")),
    ("Cloud", "cloud", ("regions", "managed services", "costs"), ("regions", "managed services", "costs")),
    ("Docker", "Docker", ("images", "layers", "runtime configuration"), ("images", "layers", "runtime configuration")),
    ("Kubernetes", "Kubernetes", ("deployments", "services", "health checks"), ("deployments", "services", "health checks")),
]

EN_VARIANTS = [
    (
        "For a {level} {role}, explain how you would use {topic} in a production project. Mention {a}, {b}, and {c}.",
        "A strong answer should connect {topic} to the product goal, explain how {a}, {b}, and {c} affect the implementation, and describe practical trade-offs. It should include how the candidate would validate the solution, monitor it after release, and adapt the design when constraints change.",
    ),
    (
        "You are reviewing a {role} task involving {topic}. What risks would you check first, and how would you improve the solution?",
        "A strong answer should identify correctness, reliability, maintainability, and user-impact risks. It should explain how {a}, {b}, and {c} influence those risks, then propose specific improvements, tests, rollout steps, and monitoring signals.",
    ),
    (
        "Describe a real debugging approach for a {level} {role} when a feature related to {topic} fails in production.",
        "A strong answer should start with impact and reproduction, then inspect logs, metrics, traces, inputs, recent changes, and dependencies. It should use {a}, {b}, and {c} to narrow the root cause, mitigate user impact, and prevent the same failure with tests or guardrails.",
    ),
]

UK_VARIANTS = [
    (
        "Для {level} {role_uk} поясни, як ти використаєш тему «{topic_uk}» у production-проєкті. Згадай {a_uk}, {b_uk} і {c_uk}.",
        "Сильна відповідь має пов'язати тему «{topic_uk}» з продуктовою ціллю, пояснити роль {a_uk}, {b_uk} і {c_uk} у реалізації та назвати практичні компроміси. Також варто описати перевірку рішення, моніторинг після релізу й адаптацію дизайну при зміні обмежень.",
    ),
    (
        "Ти рев'юїш задачу для {role_uk}, де ключова тема — «{topic_uk}». Які ризики перевіриш першими і як покращиш рішення?",
        "Сильна відповідь має назвати ризики коректності, надійності, підтримуваності та впливу на користувача. Вона повинна пояснити, як {a_uk}, {b_uk} і {c_uk} впливають на ці ризики, а потім запропонувати конкретні покращення, тести, план rollout і метрики моніторингу.",
    ),
    (
        "Опиши реальний підхід до дебагу для {level} {role_uk}, якщо production-фіча, пов'язана з темою «{topic_uk}», зламалась.",
        "Сильна відповідь має початися з оцінки впливу та відтворення проблеми, далі перевірити логи, метрики, трейси, вхідні дані, останні зміни й залежності. Потрібно використати {a_uk}, {b_uk} і {c_uk}, щоб звузити root cause, зменшити вплив на користувачів і запобігти повторенню через тести або guardrails.",
    ),
]

def build_question_bank():
    items = []

    for role, role_uk in ROLES:
        for level, level_uk in LEVELS:
            for topic, topic_uk, en_terms, uk_terms in TOPICS:
                context = {
                    "role": role,
                    "role_uk": role_uk,
                    "level": level,
                    "level_uk": level_uk,
                    "topic": topic,
                    "topic_uk": topic_uk,
                    "a": en_terms[0],
                    "b": en_terms[1],
                    "c": en_terms[2],
                    "a_uk": uk_terms[0],
                    "b_uk": uk_terms[1],
                    "c_uk": uk_terms[2],
                }

                for question_template, answer_template in EN_VARIANTS:
                    items.append({
                        "language": "en-US",
                        "role": role,
                        "level": level,
                        "category": topic,
                        "question": question_template.format(**context),
                        "ideal": answer_template.format(**context),
                    })

                for question_template, answer_template in UK_VARIANTS:
                    items.append({
                        "language": "uk-UA",
                        "role": role,
                        "level": level,
                        "category": topic,
                        "question": question_template.format(**context),
                        "ideal": answer_template.format(**context),
                    })

    return items

DEFAULT_QUESTION_BANK = build_question_bank()
