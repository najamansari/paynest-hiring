import { Handler } from '@netlify/functions';
import server from '../bidder-backend/dist/main'; // Path to your compiled NestJS app

// Netlify Function handler
export const handler: Handler = async (event, context) => {
  // Convert Netlify event to NestJS-compatible request
  const response = await server(event, context);
  
  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body
  };
};
