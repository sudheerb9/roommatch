jest.mock('./index.css', () => ({}));

jest.mock('./bootstrapRoot', () => ({
  mountApp: jest.fn(),
}));

jest.mock('./reportWebVitals', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('index.js', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('calls mountApp() then reportWebVitals()', () => {
    // eslint-disable-next-line global-require
    require('./index');

    const { mountApp } = require('./bootstrapRoot');
    const reportWebVitals = require('./reportWebVitals').default;

    expect(mountApp).toHaveBeenCalledTimes(1);
    expect(reportWebVitals).toHaveBeenCalledTimes(1);
  });
});
