import { FlatDesignToken } from '../tokens';

/** Tokens sharing the first two path segments, e.g. `color / base` */
export interface TokenGroup {
  key: string;
  label: string;
  tokens: FlatDesignToken[];
}

/**
 * One inheritance tree: tokens connected by aliases. Columns are shared by all flow
 * lanes, most derived first: the last column holds the literal values every token
 * in the lane inherits from, so ancestors are always to the right.
 */
export interface FlowLane {
  key: string;
  /** Names of the literal values the lane inherits from */
  label: string;
  columns: FlatDesignToken[][];
}

/** Unconnected tokens of one top-level group, e.g. `size`, in groups like `size / spacing` */
export interface LooseLane {
  key: string;
  label: string;
  groups: TokenGroup[];
}

export interface TokenLayout {
  /** Number of columns in every flow lane */
  columnCount: number;
  flow: FlowLane[];
  loose: LooseLane[];
}

const groupKeyOf = (token: FlatDesignToken): string =>
  token.path
    .slice(0, Math.max(1, Math.min(2, token.path.length - 1)))
    .join('/');
const unique = <T>(items: T[]): T[] => [...new Set(items)];
const mean = (values: number[]): number =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

/**
 * Lays tokens out by inheritance.
 *
 * 1. Tokens connected by aliases (directly or through other tokens) form one flow lane.
 *    Lanes are ordered by the document order of the values they inherit from.
 * 2. A token's column comes from its alias depth (0 for literal values, 1 + the deepest
 *    referenced token otherwise). Columns are shared across lanes and shown most derived
 *    first, so the flow runs from the most derived token on the left to the values on the right.
 * 3. Within a lane, aliases are ordered by the average position of the tokens they
 *    reference (barycenter heuristic), which reduces crossing lines.
 * 4. Tokens without any alias relation are unconnected: grouped by their first two path
 *    segments, one loose lane per top-level path segment.
 *
 * @param {FlatDesignToken[]} tokens - Tokens from `flattenTokens`
 * @returns {TokenLayout} The flow lanes, the loose lanes and the shared column count
 */
export const layoutTokens = (tokens: FlatDesignToken[]): TokenLayout => {
  const byId = new Map(tokens.map((token) => [token.id, token]));
  const order = new Map(tokens.map((token, index) => [token.id, index]));
  const ancestorsOf = (token: FlatDesignToken) =>
    token.ancestors
      .filter((id) => byId.has(id))
      .map((id) => byId.get(id) as FlatDesignToken);
  const isConnected = (token: FlatDesignToken) =>
    ancestorsOf(token).length > 0 ||
    token.descendants.some((id) => byId.has(id));
  // Union-find over tokens: every alias joins the two tokens' trees
  const parent = new Map(tokens.map((token) => [token.id, token.id]));
  const find = (id: string): string => {
    const root = parent.get(id) as string;

    if (root === id) return id;

    const top = find(root);

    parent.set(id, top);

    return top;
  };

  tokens.forEach((token) =>
    ancestorsOf(token).forEach((ancestor) =>
      parent.set(find(ancestor.id), find(token.id))
    )
  );

  const depths = new Map<string, number>();
  const depthOf = (token: FlatDesignToken): number => {
    const cached = depths.get(token.id);

    if (cached !== undefined) return cached;

    const ancestors = ancestorsOf(token);
    const depth = ancestors.length
      ? 1 + Math.max(...ancestors.map(depthOf))
      : 0;

    depths.set(token.id, depth);

    return depth;
  };
  const connected = tokens.filter(isConnected);
  const columnCount = connected.length
    ? 1 + Math.max(...connected.map(depthOf))
    : 0;
  const trees = new Map<string, FlatDesignToken[]>();

  connected.forEach((token) => {
    const root = find(token.id);

    trees.set(root, [...(trees.get(root) ?? []), token]);
  });

  const flow: FlowLane[] = [...trees.values()]
    .map((tree) => {
      const values = tree.filter((token) => depthOf(token) === 0);
      const byDepth: FlatDesignToken[][] = Array.from(
        { length: columnCount },
        () => []
      );
      const positions = new Map<string, number>();

      tree.forEach((token) => byDepth[depthOf(token)].push(token));
      byDepth.forEach((column, depth) => {
        if (depth > 0) {
          const barycenter = (token: FlatDesignToken) =>
            mean(
              ancestorsOf(token).map(
                (ancestor) => positions.get(ancestor.id) ?? 0
              )
            );

          column.sort((a, b) => barycenter(a) - barycenter(b));
        }

        // Normalised positions (0-1), so columns of different lengths can be compared
        column.forEach((token, index) =>
          positions.set(
            token.id,
            column.length > 1 ? index / (column.length - 1) : 0.5
          )
        );
      });

      return {
        key: values[0].id,
        label: values.map((token) => token.name).join(', '),
        columns: byDepth.reverse(),
        first: Math.min(...values.map((token) => order.get(token.id) as number))
      };
    })
    .sort((a, b) => a.first - b.first)
    .map(({ key, label, columns }) => ({ key, label, columns }));
  const groups = new Map<string, FlatDesignToken[]>();

  tokens
    .filter((token) => !isConnected(token))
    .forEach((token) => {
      const key = groupKeyOf(token);

      groups.set(key, [...(groups.get(key) ?? []), token]);
    });

  const looseKeys = [...groups.keys()];
  const loose: LooseLane[] = unique(
    looseKeys.map((key) => key.split('/')[0])
  ).map((category) => ({
    key: category,
    label: category,
    groups: looseKeys
      .filter((key) => key.split('/')[0] === category)
      .map((key) => ({
        key,
        label: key.split('/').join(' / '),
        tokens: groups.get(key) as FlatDesignToken[]
      }))
  }));

  return { columnCount, flow, loose };
};
