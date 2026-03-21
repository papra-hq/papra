import { z } from 'zod';

export const customPropertyDefinitionNameSchema = z.string().trim().min(1).max(255);
export const customPropertyDefinitionDescriptionSchema = z.string().trim().max(1000);
export const customPropertyDefinitionDisplayOrderSchema = z.number().int().min(0);
