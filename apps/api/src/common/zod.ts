import { PipeTransform } from "@nestjs/common";
import { ApiBody, ApiQuery } from "@nestjs/swagger";
import { z } from "zod";
import { AppError } from "./app-error";

/** Type des schémas OpenAPI acceptés par @nestjs/swagger, qui ne l'exporte pas. */
type SchemaObject = Extract<NonNullable<Extract<Parameters<typeof ApiBody>[0], { schema?: unknown }>["schema"]>, { type?: unknown }>;

/**
 * Validation de toute entrée par un schéma Zod, sans jamais faire confiance
 * au client (section 4.3 du plan). Les champs inconnus sont retirés, et les
 * erreurs listent chaque champ fautif avec un message en français.
 */
export class ZodPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(
        400,
        "validation_failed",
        "Certaines données sont invalides.",
        result.error.issues.map((issue) => ({
          field: issue.path.join(".") || null,
          message: issue.message,
          code: issue.code,
        })),
      );
    }
    return result.data;
  }
}

/** Schéma OpenAPI dérivé du schéma Zod, pour la documentation générée. */
export function toOpenApi(schema: z.ZodType): SchemaObject {
  const json = z.toJSONSchema(schema, { target: "openapi-3.0", io: "input", unrepresentable: "any" }) as Record<
    string,
    unknown
  >;
  delete json.$schema;
  return json as SchemaObject;
}

/** Documente le corps attendu d'une route à partir de son schéma Zod. */
export const ApiZodBody = (schema: z.ZodType) => ApiBody({ schema: toOpenApi(schema) });

/** Documente chaque paramètre de requête d'un schéma objet. */
export function ApiZodQuery(schema: z.ZodObject): MethodDecorator {
  const properties = (toOpenApi(schema).properties ?? {}) as Record<string, SchemaObject>;
  const decorators = Object.entries(properties).map(([name, property]) =>
    ApiQuery({ name, required: false, schema: property }),
  );
  return (target, key, descriptor) => {
    for (const decorate of decorators) decorate(target, key, descriptor);
  };
}
