import { createDesignTokenElement, FlatDesignToken } from '../tokens';

/**
 * A rendered design token in the flow: the flattened DTCG token plus its pill element.
 */
class DesignToken {
  el: HTMLElement;
  id: string;
  token: FlatDesignToken;

  constructor(token: FlatDesignToken) {
    this.token = token;
    this.id = token.id;
    this.el = createDesignTokenElement(token);
  }

  process(): void {
    // Implement the processing logic
  }
}

export default DesignToken;
