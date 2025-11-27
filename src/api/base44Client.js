// Local stub replacement for @base44/sdk createClient
// This provides minimal, promise-based implementations of the parts of the Base44 SDK
// that the app expects: `entities` and `auth`. The stub returns fake data and should be
// replaced with real implementations if you integrate another backend service.

// Helper: basic in-memory store per entity
const stores = {};

function ensureStore(name) {
  if (!stores[name]) stores[name] = { items: [], idCounter: 1 };
  return stores[name];
}

function createEntity(name) {
  const store = ensureStore(name);
  return {
    create: async (payload) => {
      const id = store.idCounter++;
      const item = Object.assign({ id }, payload || {});
      store.items.push(item);
      return item;
    },
    find: async (query) => {
      // very simple filter: if query has id, return that; else return all
      if (query && query.id) {
        return store.items.find(it => it.id == query.id) || null;
      }
      return store.items.slice();
    },
    list: async (opts) => {
      return store.items.slice();
    },
    update: async (id, patch) => {
      const it = store.items.find(x => x.id == id);
      if (!it) throw new Error('Not found');
      Object.assign(it, patch);
      return it;
    },
    delete: async (id) => {
      const idx = store.items.findIndex(x => x.id == id);
      if (idx === -1) throw new Error('Not found');
      store.items.splice(idx,1);
      return true;
    }
  };
}

// Create a fake `base44` object similar to what the app expects
export const base44 = {
  entities: new Proxy({}, {
    get(target, prop) {
      if (!target[prop]) {
        target[prop] = createEntity(prop.toString());
      }
      return target[prop];
    }
  }),
  auth: {
    // minimal auth stub: simple token storage
    currentUser: null,
    async login(credentials) {
      this.currentUser = { id: 1, name: 'Local User', email: credentials?.email || 'user@example.com' };
      return this.currentUser;
    },
    async logout() {
      this.currentUser = null;
      return true;
    },
    async getCurrentUser() {
      return this.currentUser;
    }
  },
  // functions / media can be extended here as needed
  functions: {},
  media: {}
};

// Also export a createClient function to mimic original usage
export function createClient(opts = {}) {
  // ignore opts; return the stub base44
  return base44;
}
