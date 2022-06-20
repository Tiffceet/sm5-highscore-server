import path from "path";
const dirname = path.resolve(path.dirname("")) + path.sep;

const DIFF_MAP = {
    Novice: "Beginner",
    Easy: "Basic",
    Medium: "Difficult",
    Hard: "Expert",
    Expert: "Challenge",
};

const TIER_MAP = {
    Tier01: "AAA+",
    Tier02: "AAA",
    Tier03: "AA+",
    Tier04: "AA",
    Tier05: "AA-",
    Tier06: "A+",
    Tier07: "A",
    Tier08: "A-",
    Tier09: "B+",
    Tier10: "B",
    Tier11: "B-",
    Tier12: "C+",
    Tier13: "C",
    Tier14: "C-",
    Tier15: "D+",
    Tier16: "D",
    Tier17: "D",
    Failed: "E (Failed)",
};

const FC_MAP = {
    MFC: "⚪",
    PFC: "🟡",
    GRFC: "🟢",
    GOFC: "🔵",
};

export { dirname, DIFF_MAP, FC_MAP, TIER_MAP };
