
/**
 * @fileOverview This file is DEPRECATED and marked for deletion as of v3.4.6.3.
 * Its functionality was part of the v3.3 augmented search feature which has been removed.
 * This file is kept empty to break any accidental imports during builds. It can be safely deleted.
 */

import { z } from 'zod';

export const AugmentedTaSearchInputSchema = z.object({});
export type AugmentedTaSearchInput = z.infer<typeof AugmentedTaSearchInputSchema>;
export const AugmentedTaSearchOutputSchema = z.object({});
export type AugmentedTaSearchOutput = z.infer<typeof AugmentedTaSearchOutputSchema>;
