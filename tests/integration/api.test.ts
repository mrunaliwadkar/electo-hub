import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// 1. Mock DB (Prisma)
vi.mock('@/lib/db', () => {
  return {
    db: {
      component: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      project: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      projectComponent: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      bOM: {
        create: vi.fn(),
      },
    },
  };
});

// 2. Mock Auth
vi.mock('@/lib/auth-utils', () => {
  return {
    checkRole: vi.fn(),
    unauthorizedResponse: (msg = 'Unauthorized') => {
      return NextResponse.json({ error: msg }, { status: 401 });
    },
    forbiddenResponse: (msg = 'Forbidden') => {
      return NextResponse.json({ error: msg }, { status: 403 });
    },
  };
});

// 3. Mock Typesense
const mockSearch = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/lib/typesense', () => {
  return {
    typesense: {
      collections: vi.fn(() => ({
        documents: vi.fn(() => ({
          search: mockSearch,
          upsert: vi.fn(),
          delete: mockDelete,
        })),
      })),
    },
    COLLECTION_NAME: 'components',
    indexComponentInTypesense: vi.fn(),
  };
});

// Import handlers
import { GET as getComponents, POST as createComponent } from '../../apps/web/src/app/api/components/route';
import { GET as getComponentsById, PUT as updateComponent, DELETE as deleteComponent } from '../../apps/web/src/app/api/components/[id]/route';
import { GET as getProjects, POST as createProject } from '../../apps/web/src/app/api/projects/route';
import { GET as getProjectById, PUT as updateProject, DELETE as deleteProject } from '../../apps/web/src/app/api/projects/[id]/route';
import { POST as optimizeBOM } from '../../apps/web/src/app/api/bom/optimize/route';

// Import mocked modules for asserting/configuring behavior
import { db } from '@/lib/db';
import { checkRole } from '@/lib/auth-utils';

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/components (Search)', () => {
    it('should return search results from Typesense', async () => {
      mockSearch.mockResolvedValueOnce({
        hits: [
          {
            document: {
              id: 'comp-123',
              mpn: 'NE555DR',
              description: 'Timer IC',
              manufacturer: 'TI',
              category: 'Timers',
              lifecycle: 'ACTIVE',
              stock_total: 500,
            },
          },
        ],
        found: 1,
        page: 1,
      });

      const req = new NextRequest('http://localhost/api/components?q=NE555');
      const res = await getComponents(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hits[0].document.mpn).toBe('NE555DR');
    });

    it('should fall back to Database search if Typesense is unavailable', async () => {
      mockSearch.mockRejectedValueOnce(new Error('Typesense Down'));
      
      vi.mocked(db.component.count).mockResolvedValueOnce(1);
      vi.mocked(db.component.findMany).mockResolvedValueOnce([
        {
          id: 'comp-123',
          mpn: 'NE555DR',
          description: 'Timer IC',
          manufacturer: { name: 'TI' },
          category: { name: 'Timers' },
          lifecycle: 'ACTIVE',
          stock: [{ stockQty: 500 }],
          assets: [],
        } as any,
      ]);

      const req = new NextRequest('http://localhost/api/components?q=NE555');
      const res = await getComponents(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.fallback).toBe(true);
      expect(data.hits[0].document.mpn).toBe('NE555DR');
      expect(db.component.findMany).toHaveBeenCalled();
    });

    it('should return 400 for invalid query parameters', async () => {
      const req = new NextRequest('http://localhost/api/components?lifecycle=INVALID_STATUS');
      const res = await getComponents(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/components (Create Component)', () => {
    it('should allow admins to create a component', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: true, role: 'ADMIN', user: { id: 'admin-1', role: 'ADMIN', email: 'a@a.com' } });
      vi.mocked(db.component.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.component.create).mockResolvedValueOnce({
        id: 'new-comp-id',
        mpn: 'LM317T',
        description: 'Voltage Regulator',
        manufacturerId: 'mfr-123',
        categoryId: 'cat-123',
        lifecycle: 'ACTIVE',
        specs: {},
        pins: [],
        assets: [],
        manufacturer: { name: 'ON Semi' },
        category: { name: 'Regulators' },
      } as any);

      const payload = {
        mpn: 'LM317T',
        description: 'Voltage Regulator',
        manufacturerId: '00000000-0000-0000-0000-000000000000', // valid uuid
        categoryId: '00000000-0000-0000-0000-000000000000', // valid uuid
        lifecycle: 'ACTIVE',
        specs: {},
      };

      const req = new NextRequest('http://localhost/api/components', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await createComponent(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.mpn).toBe('LM317T');
    });

    it('should deny non-admins', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: false, role: 'USER', user: { id: 'user-1', role: 'USER', email: 'u@u.com' } });
      
      const req = new NextRequest('http://localhost/api/components', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await createComponent(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/bom/optimize', () => {
    it('should optimize a CSV BOM', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: true, role: 'USER', user: { id: 'user-1', role: 'USER', email: 'u@u.com' } });
      
      // Mock Typesense match
      mockSearch.mockResolvedValue({
        hits: [
          {
            document: {
              id: 'comp-123',
              mpn: 'NE555DR',
            },
          },
        ],
      });

      // Mock database component fetch
      vi.mocked(db.component.findUnique).mockResolvedValue({
        id: 'comp-123',
        mpn: 'NE555DR',
        description: 'Timer IC',
        manufacturer: { name: 'TI' },
        stock: [
          {
            distributor: 'LCSC',
            sku: 'LCSC-555',
            stockQty: 100,
            priceTiers: [
              { qty: 1, price: 0.10 },
              { qty: 10, price: 0.08 },
            ],
          },
          {
            distributor: 'DIGIKEY',
            sku: 'DK-555',
            stockQty: 100,
            priceTiers: [
              { qty: 1, price: 0.15 },
            ],
          },
        ],
      } as any);

      // Construct form data with file
      const formData = new FormData();
      const csvContent = 'mpn,qty\nNE555DR,5\n';
      const file = new File([csvContent], 'bom.csv', { type: 'text/csv' });
      formData.append('file', file);

      const req = new NextRequest('http://localhost/api/bom/optimize', {
        method: 'POST',
        body: formData,
      });

      const res = await optimizeBOM(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.matchedCount).toBe(1);
      expect(data.splits.lcsc.items.length).toBe(1); // chosen as cheaper option
      expect(data.splits.lcsc.items[0].unitPrice).toBe(0.10);
    });
  });

  describe('Projects API (/api/projects)', () => {
    it('should list user projects', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: true, role: 'USER', user: { id: 'user-123', role: 'USER', email: 'u@u.com' } });
      vi.mocked(db.project.findMany).mockResolvedValueOnce([
        { id: 'proj-1', name: 'My Board', userId: 'user-123', _count: { components: 2 } },
      ] as any);

      const req = new NextRequest('http://localhost/api/projects');
      const res = await getProjects(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data[0].name).toBe('My Board');
    });

    it('should create a new project', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: true, role: 'USER', user: { id: 'user-123', role: 'USER', email: 'u@u.com' } });
      vi.mocked(db.project.create).mockResolvedValueOnce({
        id: 'proj-new',
        name: 'New IoT Project',
        description: 'WiFi sensor board',
        userId: 'user-123',
      } as any);

      const req = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'New IoT Project', description: 'WiFi sensor board' }),
      });

      const res = await createProject(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe('New IoT Project');
    });
  });

  describe('Project Details API (/api/projects/[id])', () => {
    it('should get project details if owned by user', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: true, role: 'USER', user: { id: 'user-123', role: 'USER', email: 'u@u.com' } });
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({
        id: 'proj-1',
        name: 'My Board',
        userId: 'user-123',
        components: [],
      } as any);

      const req = new NextRequest('http://localhost/api/projects/proj-1');
      const res = await getProjectById(req, { params: Promise.resolve({ id: 'proj-1' }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('proj-1');
    });

    it('should prevent user from viewing another user\'s project', async () => {
      vi.mocked(checkRole).mockResolvedValueOnce({ authorized: true, role: 'USER', user: { id: 'user-123', role: 'USER', email: 'u@u.com' } });
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({
        id: 'proj-1',
        name: 'Someone Else\'s Board',
        userId: 'user-999',
      } as any);

      const req = new NextRequest('http://localhost/api/projects/proj-1');
      const res = await getProjectById(req, { params: Promise.resolve({ id: 'proj-1' }) });

      expect(res.status).toBe(403);
    });
  });
});
