/** Escapes special regex characters in a string to create a RegExp that matches it literally */
export function escape(str: string): RegExp {
    return new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // $& means the whole matched string
}

/** Converts "/regex/" into RegExp */
export function parse(pattern: string): RegExp | undefined {
    try {
        const trimmedSlashes: string = pattern.replace(/^\/|\/$/g, '');
        return RegExp(trimmedSlashes);
    } catch {
        return undefined;
    }
}

/** Makes a pattern optional by adding ? quantifier, equivalent to (pattern)? */
export function optional(pattern: RegExp): RegExp {
    return new RegExp(group(pattern).source + '?');
}

/** Creates a named capture group from the pattern, equivalent to (?<name>pattern) */
export function capture(pattern: RegExp, groupName: string): RegExp {
    return group(pattern, { name: groupName });
}

/** Express unit?/scope?/encapsulated?/unbreakable? of inner pattern */
export function group(inner: RegExp, options?: { name?: string }): RegExp {
    let identifier = '';
    if (options?.name) identifier = `?<${options.name}>`;
    return new RegExp('(' + identifier + inner.source + ')');
}

/** Combines multiple patterns sequentially into a single pattern */
export function concat(...chain: RegExp[]): RegExp {
    const combined: string = chain
        .filter(Boolean)
        .map(pattern => pattern.source)
        .join('');
    return new RegExp(combined);
}

/** Creates an alternation (OR) group from multiple patterns, equivalent to (pattern1|pattern2) */
export function alternate(...options: RegExp[]): RegExp {
    const alternated: string = options
        .filter(Boolean)
        .map(pattern => pattern.source)
        .join('|');
    return group(new RegExp(alternated));
}