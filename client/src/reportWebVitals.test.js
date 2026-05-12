import reportWebVitals from './reportWebVitals';

describe('reportWebVitals', () => {
  it('no-ops when callback is missing', () => {
    expect(() => reportWebVitals()).not.toThrow();
  });
});
