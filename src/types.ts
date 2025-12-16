declare const __brand: unique symbol;

export type FontId = string & { [__brand]: 'FontId' };
export type FontPageId = string & { [__brand]: 'FontPageId' };

export type Font = { name: string; id: FontId };
