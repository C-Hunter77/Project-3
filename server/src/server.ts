// server.ts

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import typeDefs from './schemas/typeDefs';
import resolvers from './resolvers';
import { authMiddleware } from './utils/auth';
import {
  validateContactForm,
  handleContactSubmission,
} from './middleware/contacts';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const MONGODB_URI = process.env.MONGODB_URI || '';
const GRAPHQL_PATH = '/graphql';

async function startServer() {
  // 1. Create Express app
  const app = express();

  // 2. Global middleware
  app.use(cors());
  app.use(bodyParser.json());

  // 3. Contact form REST endpoint
  app.post(
    '/contact',
    validateContactForm,
    handleContactSubmission
  );

  // 4. Initialize Apollo Server
  const apolloServer = new ApolloServer<{ user?: any }>({
    typeDefs,
    resolvers,
  });
  await apolloServer.start();

  // 5. Mount GraphQL endpoint
  app.use(
    GRAPHQL_PATH,
    cors(),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: Request }) => {
        // You can use authMiddleware to parse JWT and attach user
        const user = await authMiddleware(req);
        return { user };
      },
    })
  );

  // 6. Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🗄️  Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }

  // 7. Start HTTP server
  app.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${GRAPHQL_PATH}`
    );
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
