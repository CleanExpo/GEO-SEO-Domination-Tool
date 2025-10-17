import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/crm/contacts`;

let createdContactId: string;

test.describe('CRM Contacts API', () => {
  test.describe('POST /api/crm/contacts', () => {
    test('should create a new contact with all fields', async ({ request }) => {
      const response = await request.post(API_URL, {
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          company: 'Acme Corp',
          notes: 'Important client',
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.contact).toBeDefined();
      expect(data.contact.id).toBeDefined();
      expect(data.contact.name).toBe('John Doe');
      expect(data.contact.email).toBe('john.doe@example.com');
      expect(data.contact.phone).toBe('+1-555-0123');
      expect(data.contact.company).toBe('Acme Corp');
      expect(data.contact.notes).toBe('Important client');

      createdContactId = data.contact.id;
    });

    test('should create a contact with only required fields', async ({ request }) => {
      const response = await request.post(API_URL, {
        data: {
          name: 'Jane Smith',
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.contact.name).toBe('Jane Smith');
      expect(data.contact.email).toBeUndefined();
    });

    test('should fail with 400 when name is missing', async ({ request }) => {
      const response = await request.post(API_URL, {
        data: {
          email: 'test@example.com',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    test('should fail with 400 when email is invalid', async ({ request }) => {
      const response = await request.post(API_URL, {
        data: {
          name: 'Test User',
          email: 'invalid-email',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });
  });

  test.describe('GET /api/crm/contacts', () => {
    test('should retrieve all contacts', async ({ request }) => {
      const response = await request.get(API_URL);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
      expect(data.total).toBeGreaterThan(0);
    });

    test('should filter contacts by search term', async ({ request }) => {
      const response = await request.get(`${API_URL}?search=John`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${API_URL}?limit=5&offset=0`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.contacts.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('GET /api/crm/contacts/[id]', () => {
    test('should retrieve a single contact by ID', async ({ request }) => {
      // First, create a contact
      const createResponse = await request.post(API_URL, {
        data: { name: 'Get Test Contact' },
      });
      const { contact } = await createResponse.json();

      // Then, retrieve it
      const response = await request.get(`${API_URL}/${contact.id}`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.contact).toBeDefined();
      expect(data.contact.id).toBe(contact.id);
      expect(data.contact.name).toBe('Get Test Contact');
    });

    test('should return 404 for non-existent contact', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.get(`${API_URL}/${fakeId}`);

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Contact not found');
    });

    test('should return 400 for invalid UUID format', async ({ request }) => {
      const response = await request.get(`${API_URL}/invalid-id`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid contact ID format');
    });
  });

  test.describe('PUT /api/crm/contacts/[id]', () => {
    test('should update a contact', async ({ request }) => {
      // First, create a contact
      const createResponse = await request.post(API_URL, {
        data: { name: 'Update Test' },
      });
      const { contact } = await createResponse.json();

      // Then, update it
      const response = await request.put(`${API_URL}/${contact.id}`, {
        data: {
          name: 'Updated Name',
          email: 'updated@example.com',
          company: 'New Company',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.contact.name).toBe('Updated Name');
      expect(data.contact.email).toBe('updated@example.com');
      expect(data.contact.company).toBe('New Company');
    });

    test('should return 404 when updating non-existent contact', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.put(`${API_URL}/${fakeId}`, {
        data: { name: 'Test' },
      });

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Contact not found');
    });

    test('should return 400 for invalid email in update', async ({ request }) => {
      // First, create a contact
      const createResponse = await request.post(API_URL, {
        data: { name: 'Validation Test' },
      });
      const { contact } = await createResponse.json();

      // Then, try to update with invalid email
      const response = await request.put(`${API_URL}/${contact.id}`, {
        data: { email: 'invalid-email' },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });
  });

  test.describe('DELETE /api/crm/contacts/[id]', () => {
    test('should delete a contact', async ({ request }) => {
      // First, create a contact
      const createResponse = await request.post(API_URL, {
        data: { name: 'Delete Test' },
      });
      const { contact } = await createResponse.json();

      // Then, delete it
      const response = await request.delete(`${API_URL}/${contact.id}`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request.get(`${API_URL}/${contact.id}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 when deleting non-existent contact', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.delete(`${API_URL}/${fakeId}`);

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Contact not found');
    });

    test('should return 400 for invalid UUID in delete', async ({ request }) => {
      const response = await request.delete(`${API_URL}/invalid-id`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid contact ID format');
    });
  });
});
