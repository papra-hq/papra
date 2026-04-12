import z from 'zod';

export const selectCustomPropertyOptionNameSchema = z.string().trim().min(1).max(255);
