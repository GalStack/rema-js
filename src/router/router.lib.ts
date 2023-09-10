import express from "express";
import { RouteDef, RouterDef, ValidationDef } from "./router.typings";

class ValidationErrors extends Error {
  code: string;
  constructor(public errors: ValidationError[]) {
    super("Validation errors");
    this.code = "validation_errors";
    this.errors = errors;
  }
}

class ValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    public message: string
  ) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

const validationMiddleware = <
  TParams extends Record<string, string> = {},
  TBody extends Record<string, string> = {}
>(
  route: RouteDef<TParams, TBody>
) => {
  return (req: express.Request, res: express.Response, next: any) => {
    const errors: ValidationError[] = [];
    if (route.validations?.params) {
      for (const key of Object.keys(route.validations.params)) {
        const validator = route.validations.params[key];
        try {
          const result = validator(key, req.params[key]);
          if (result) {
            errors.push(new ValidationError(key, result.code, result.message));
          }
        } catch (e) {
          res.status(400).send((e as any).message);
        }
      }
    }
    if (route.validations?.body) {
      for (const key of Object.keys(route.validations.body)) {
        const validator = route.validations.body[key];
        try {
          const result = validator(key, req.body[key]);
          if (result) {
            errors.push(new ValidationError(key, result.code, result.message));
          }
        } catch (e) {
          res.status(400).send((e as any).message);
        }
      }
    }
    if (errors.length > 0) {
      res.status(400).send(new ValidationErrors(errors));
    }
    next();
  };
};

export const createRouter = <
  T extends Record<string, Array<RouteDef<any, any>>>
>(
  routerDef: RouterDef<T>
): express.Router => {
  const router = express.Router();

  for (const path of Object.keys(routerDef)) {
    const routes = routerDef[path];
    for (const route of routes) {
      router.use(validationMiddleware(route));
      router[route.method](path + route.path, route.handler);
    }
  }

  return router;
};

export const createApplication = (routers: express.Router[]) => {
  const app = express();
  app.use(express.json());

  for (const router of routers) {
    app.use(router);
  }
  return app;
};

export const stringValidator: ValidationDef = (field: string, value: any) => {
  if (typeof value !== "string") {
    return {
      code: "invalid_type",
      field,
      message: "Expected string, got " + typeof value,
    };
  }

  return undefined;
};
