// Operations API. Pages import from here (or the module files), never from src/mocks.
// Each module file has its own USE_MOCK flag - flip it to false when Dev 1 ships that API.
export * from './products'
export * from './inventory'
export * from './technicians'
export * from './installations'
export * from './warranties'
export * from './tickets'
