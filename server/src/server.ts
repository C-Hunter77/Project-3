// server/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import typeDefs from './schemas/typeDefs';
import resolvers from './schemas/resolvers';
import { authMiddleware } from './utils/auth';
import {
  validateContactForm,
  handleContactSubmission,
} from './middleware/contacts';

dotenv.config();

async function start() {
  // 1) Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('✅ MongoDB connected');

  // 2) Create Express app
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

  // 3) Global middleware
  app.use(cors());
  app.use(bodyParser.json());

  // 4) REST endpoint for contact form
  app.post(
    '/contact',
    validateContactForm,
    handleContactSubmission
  );

  // 5) Apollo GraphQL setup
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(apollo, {
      context: async ({ req }: { req: Request }) => ({
        user: await authMiddleware(req),
      }),
    })
  );

  // 6) Start listening
  app.listen(PORT, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
  );
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
