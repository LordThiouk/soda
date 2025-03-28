const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

// Mock du module Supabase - celui-ci est déjà configuré dans jest.setup.js
// et ne nécessite pas de configuration supplémentaire ici.

// Mock du module de validation
jest.mock('../../src/validations', () => {
  return require('../__mocks__/validation');
});

// Mock du module swagger-jsdoc
jest.mock('swagger-jsdoc', () => require('../__mocks__/swagger-jsdoc'));

describe('Authentication Integration Tests', () => {
  let agent;

  beforeEach(() => {
    agent = request(app);
    
    // Les mocks sont réinitialisés après chaque test grâce à la configuration dans jest.setup.js
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await agent
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Compte créé avec succès');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', 'mock-id');
      expect(response.body.data.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.data).toHaveProperty('token', 'mock-token');
    });

    it('should return 400 when missing required fields', async () => {
      const response = await agent
        .post('/api/auth/register')
        .send({
          // Email manquant
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 when email already exists', async () => {
      // Premier enregistrement
      await agent
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Existing',
          lastName: 'User',
          role: 'user'
        });

      // Tentative avec le même email
      const response = await agent
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Another',
          lastName: 'User',
          role: 'user'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user and return token with user data', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body.data).toHaveProperty('token', 'mock-token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', 'mock-id');
      expect(response.body.data.user).toHaveProperty('email', 'user@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const token = global.createTestToken();

      const response = await agent
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data for authenticated user', async () => {
      const token = global.createTestToken();

      const response = await agent
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await agent
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
});