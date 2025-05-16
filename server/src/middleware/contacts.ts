// server/src/middleware/contacts.ts

import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';

/**
 * Middleware to validate contact form fields.
 */
export const validateContactForm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ message: 'All fields are required!' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Invalid email address!' });
    return;
  }

  next();
};

/**
 * Handler to save the contact form submission to the database.
 */
export const handleContactSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, message } = req.body;

    const newMessage = new Message({
      sender:    email,
      recipient: 'support@tutortrader.com', // adjust as needed
      content:   `From: ${name} <${email}>\n\n${message}`,
      sentAt:    new Date(),
    });

    await newMessage.save();

    res
      .status(201)
      .json({ message: 'Your message has been received. Thank you!' });
  } catch (err) {
    next(err);
  }
};
