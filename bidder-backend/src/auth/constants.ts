export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'defaultSecretKey', // In production, use environment variable
};
