import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import jwt from "jsonwebtoken";
import apiRoutes from "./routes/index.js";
import { env } from "./config/env.js";
import { graphQLSchema, type GraphQLContext } from "./graphql/schema.js";
import { errorHandler, notFound } from "./middleware/error.js";
import passport from "./config/passport.js";

export async function buildApp() {
  const app = express();

  app.use(
    helmet({
      // Allow Apollo Sandbox assets in development while keeping defaults elsewhere.
      contentSecurityPolicy: env.NODE_ENV === "development" ? false : undefined,
      crossOriginEmbedderPolicy: env.NODE_ENV === "development" ? false : undefined
    })
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(passport.initialize());

  app.get("/", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "chaintrace-backend",
      docs: {
        health: "/api/health",
        restBase: "/api",
        graphql: "/graphql"
      }
    });
  });

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema: graphQLSchema
  });
  await apolloServer.start();

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) return {};
        const token = header.slice("Bearer ".length);
        try {
          const payload = jwt.verify(token, env.JWT_SECRET) as GraphQLContext["user"];
          return { user: payload };
        } catch {
          return {};
        }
      }
    })
  );

  app.use("/api", apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
