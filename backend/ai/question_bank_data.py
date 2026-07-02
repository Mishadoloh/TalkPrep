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
        "You are reviewing a {level} {role} task involving {topic}. What risks would you check first, and how would you improve the solution?",
        "A strong answer should identify correctness, reliability, maintainability, and user-impact risks. It should explain how {a}, {b}, and {c} influence those risks, then propose specific improvements, tests, rollout steps, and monitoring signals.",
    ),
    (
        "Describe a real debugging approach for a {level} {role} when a feature related to {topic} fails in production.",
        "A strong answer should start with impact and reproduction, then inspect logs, metrics, traces, inputs, recent changes, and dependencies. It should use {a}, {b}, and {c} to narrow the root cause, mitigate user impact, and prevent the same failure with tests or guardrails.",
    ),
    (
        "Design an interview-grade solution for a {role} problem centered on {topic}. How would your answer change at {level} level?",
        "A strong answer should separate fundamentals from level-specific depth. It should explain the baseline solution, then show how a {level} candidate handles {a}, {b}, and {c} with clearer trade-offs, stronger failure handling, and more ownership of production impact.",
    ),
    (
        "What are the most common mistakes {level} candidates make when discussing {topic} for a {role} position, and how would you avoid them?",
        "A strong answer should name concrete mistakes such as vague definitions, missing edge cases, ignoring operational constraints, and failing to connect {a}, {b}, and {c}. It should then give practical ways to avoid those mistakes through examples, tests, measurement, and clear communication.",
    ),
    (
        "Compare two possible approaches to {topic} for a {level} {role}. Which one would you choose and why?",
        "A strong answer should define both approaches, compare them across complexity, reliability, cost, team maintainability, and user impact. It should use {a}, {b}, and {c} as decision criteria and explain when the other approach would become better.",
    ),
    (
        "How would a {level} {role} explain {topic} to a teammate who understands the basics but has never shipped it in production?",
        "A strong answer should be simple but not shallow. It should introduce the concept, then move into production concerns: {a}, {b}, {c}, failure modes, testing strategy, observability, and how to know the implementation is working after release.",
    ),
    (
        "Create a test plan for a {level} {role} feature where {topic} is the riskiest part.",
        "A strong answer should include unit, integration, end-to-end, regression, and negative tests where appropriate. It should cover {a}, {b}, and {c}, explain test data choices, automation scope, and how the team would catch issues before and after deployment.",
    ),
    (
        "A stakeholder asks a {level} {role} to ship a shortcut around {topic}. What questions would you ask before agreeing?",
        "A strong answer should clarify business urgency, user impact, reversibility, security or data risk, and operational blast radius. It should discuss {a}, {b}, and {c}, then propose a safer phased plan with monitoring and rollback criteria.",
    ),
    (
        "What metrics would a {level} {role} track to know whether a {topic} implementation is healthy?",
        "A strong answer should define technical and product-facing metrics. It should connect {a}, {b}, and {c} to measurable signals, include alert thresholds, dashboards, regression indicators, and a process for investigating anomalies.",
    ),
]

UK_VARIANTS = [
    (
        "Для {level} {role_uk} поясни, як ти використаєш тему «{topic_uk}» у production-проєкті. Згадай {a_uk}, {b_uk} і {c_uk}.",
        "Сильна відповідь має пов'язати тему «{topic_uk}» з продуктовою ціллю, пояснити роль {a_uk}, {b_uk} і {c_uk} у реалізації та назвати практичні компроміси. Також варто описати перевірку рішення, моніторинг після релізу й адаптацію дизайну при зміні обмежень.",
    ),
    (
        "Ти рев'юїш задачу для {level} {role_uk}, де ключова тема — «{topic_uk}». Які ризики перевіриш першими і як покращиш рішення?",
        "Сильна відповідь має назвати ризики коректності, надійності, підтримуваності та впливу на користувача. Вона повинна пояснити, як {a_uk}, {b_uk} і {c_uk} впливають на ці ризики, а потім запропонувати конкретні покращення, тести, план rollout і метрики моніторингу.",
    ),
    (
        "Опиши реальний підхід до дебагу для {level} {role_uk}, якщо production-фіча, пов'язана з темою «{topic_uk}», зламалась.",
        "Сильна відповідь має початися з оцінки впливу та відтворення проблеми, далі перевірити логи, метрики, трейси, вхідні дані, останні зміни й залежності. Потрібно використати {a_uk}, {b_uk} і {c_uk}, щоб звузити root cause, зменшити вплив на користувачів і запобігти повторенню через тести або guardrails.",
    ),
    (
        "Спроєктуй рішення для співбесіди на позицію {role_uk}, де центральна тема — «{topic_uk}». Як відповідь має відрізнятися для рівня {level}?",
        "Сильна відповідь має відокремити базові поняття від глибини конкретного рівня. Вона повинна пояснити основне рішення, а потім показати, як кандидат рівня {level} працює з {a_uk}, {b_uk} і {c_uk}, враховуючи компроміси, відмовостійкість і вплив на production.",
    ),
    (
        "Які найчастіші помилки кандидати рівня {level} роблять, коли пояснюють тему «{topic_uk}» для ролі {role_uk}, і як ти їх уникнеш?",
        "Сильна відповідь має назвати конкретні помилки: нечіткі визначення, пропущені крайові випадки, ігнорування операційних обмежень і слабкий зв'язок між {a_uk}, {b_uk} та {c_uk}. Потім потрібно показати, як уникати цих помилок через приклади, тести, вимірювання й чітку комунікацію.",
    ),
    (
        "Порівняй два підходи до теми «{topic_uk}» для {level} {role_uk}. Який обереш і чому?",
        "Сильна відповідь має описати обидва підходи й порівняти їх за складністю, надійністю, вартістю, підтримуваністю для команди та впливом на користувача. {a_uk}, {b_uk} і {c_uk} мають бути критеріями рішення, а також треба пояснити, коли інший підхід став би кращим.",
    ),
    (
        "Як {level} {role_uk} пояснить тему «{topic_uk}» колезі, який знає базу, але ще не запускав це в production?",
        "Сильна відповідь має бути простою, але не поверхневою. Треба почати з суті концепції, а потім перейти до production-питань: {a_uk}, {b_uk}, {c_uk}, типові відмови, стратегія тестування, observability і критерії успішного релізу.",
    ),
    (
        "Склади тест-план для фічі {level} {role_uk}, де тема «{topic_uk}» є найризикованішою частиною.",
        "Сильна відповідь має містити unit, integration, end-to-end, regression і negative tests там, де це доречно. Потрібно покрити {a_uk}, {b_uk} і {c_uk}, пояснити тестові дані, межі автоматизації та як команда ловитиме проблеми до й після деплою.",
    ),
    (
        "Стейкхолдер просить {level} {role_uk} швидко обійти правильне рішення для теми «{topic_uk}». Які питання поставиш перед тим, як погодитись?",
        "Сильна відповідь має уточнити бізнес-терміновість, вплив на користувачів, зворотність рішення, безпекові або data-ризики та blast radius. Треба обговорити {a_uk}, {b_uk} і {c_uk}, а потім запропонувати безпечніший поетапний план із моніторингом і rollback-критеріями.",
    ),
    (
        "Які метрики має відстежувати {level} {role_uk}, щоб зрозуміти, що реалізація «{topic_uk}» здорова?",
        "Сильна відповідь має визначити технічні та продуктові метрики. Потрібно пов'язати {a_uk}, {b_uk} і {c_uk} з вимірюваними сигналами, додати alert-пороги, dashboard-и, індикатори регресій і процес розбору аномалій.",
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

def ensure_unique_question_bank(items):
    seen_questions = set()
    seen_scoped_questions = set()
    unique_items = []

    for item in items:
        question_key = " ".join(item["question"].lower().split())
        scoped_key = (item["language"], item["role"], item["level"], question_key)

        if question_key in seen_questions:
            raise ValueError(f"Duplicate question text generated: {item['question']}")
        if scoped_key in seen_scoped_questions:
            raise ValueError(f"Duplicate scoped question generated: {item['language']} {item['role']} {item['level']} {item['question']}")

        seen_questions.add(question_key)
        seen_scoped_questions.add(scoped_key)
        unique_items.append(item)

    return unique_items

DEFAULT_QUESTION_BANK = ensure_unique_question_bank(build_question_bank())
