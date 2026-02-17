export type TagCategory = "engine" | "creative" | "meta" | "personal";

function normalize(tag: string) {
    return tag.trim().toLowerCase();
}

const TAGS_BY_CATEGORY: Record<TagCategory, readonly string[]> = {
    engine: [
        "godot",
        "gamedev",
        "gdscript",
        "python",
        "neo4j",
        "node.js",
        "typescript",
        "express",
        ".net",
        "c#",
        "django",
        "laravel",
        "aws",
        "aws lambda",
        "dynamodb",
        "sqs/sns",
        "terraform",
        "serverless",
        "react",
    ],
    creative: ["psx", "blender", "3d", "music"],
    meta: ["tech", "ai", "dx", "openai", "auth0", "prompt engineering"],
    personal: ["personal"],
};

const TAG_SETS: Record<TagCategory, ReadonlySet<string>> = {
    engine: new Set(TAGS_BY_CATEGORY.engine.map(normalize)),
    creative: new Set(TAGS_BY_CATEGORY.creative.map(normalize)),
    meta: new Set(TAGS_BY_CATEGORY.meta.map(normalize)),
    personal: new Set(TAGS_BY_CATEGORY.personal.map(normalize)),
};

export function getTagCategory(tag: string): TagCategory {
    const t = normalize(tag);

    if (TAG_SETS.engine.has(t)) return "engine";
    if (TAG_SETS.creative.has(t)) return "creative";
    if (TAG_SETS.personal.has(t)) return "personal";
    if (TAG_SETS.meta.has(t)) return "meta";

    // Default to the most neutral palette.
    return "meta";
}
