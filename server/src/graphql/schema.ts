import { makeExecutableSchema } from "@graphql-tools/schema";
import { getProductJourney, listLatestCheckpointsByOrganization, listProductsByOrganization } from "../services/productService.js";

export interface GraphQLContext {
  user?: {
    sub: string;
    orgId?: string;
    role: string;
  };
}

const typeDefs = `#graphql
  type Product {
    id: ID!
    productId: String!
    domain: String!
    productName: String!
    batchNumber: String!
    originLocation: String!
    authenticityScore: Int
    blockchainTxHash: String
    createdAt: String
  }

  type Checkpoint {
    id: ID!
    productId: String!
    checkpointType: String!
    location: String!
    temperature: Float
    humidity: Float
    blockchainTxHash: String
    createdAt: String
  }

  type Journey {
    product: Product!
    checkpoints: [Checkpoint!]!
  }

  type Query {
    products(domain: String): [Product!]!
    productJourney(productId: String!): Journey
    latestCheckpoints(limit: Int = 20): [Checkpoint!]!
  }
`;

const resolvers = {
  Query: {
    products: async (_: unknown, args: { domain?: string }, context: GraphQLContext) => {
      if (!context.user?.orgId) return [];
      return listProductsByOrganization(context.user.orgId, args.domain);
    },
    productJourney: async (_: unknown, args: { productId: string }, context: GraphQLContext) => {
      if (!context.user?.orgId) return null;
      const journey = await getProductJourney(args.productId);
      if (!journey) return null;
      if (journey.product.organizationId !== context.user.orgId) return null;
      return journey;
    },
    latestCheckpoints: async (_: unknown, args: { limit: number }, context: GraphQLContext) => {
      if (!context.user?.orgId) return [];
      return listLatestCheckpointsByOrganization(context.user.orgId, args.limit ?? 20);
    }
  }
};

export const graphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers
});
