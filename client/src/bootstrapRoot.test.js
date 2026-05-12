jest.mock('./index.css', () => ({}));

jest.mock('./App', () => {
  const React = require('react');
  return function MockApp() {
    return React.createElement('div', { 'data-testid': 'root-app' }, 'App');
  };
});

const mockRender = jest.fn();
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: mockRender,
  })),
}));

describe('bootstrapRoot', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    mockRender.mockClear();
    const { createRoot } = require('react-dom/client');
    createRoot.mockClear();
  });

  it('mounts StrictMode + BrowserRouter + App into the given element', () => {
    const React = require('react');
    const { StrictMode } = React;
    const { BrowserRouter } = require('react-router-dom');
    const { mountApp } = require('./bootstrapRoot');

    mountApp(document.getElementById('root'));

    const { createRoot } = require('react-dom/client');
    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mockRender).toHaveBeenCalledTimes(1);

    const tree = mockRender.mock.calls[0][0];
    expect(tree.type).toBe(StrictMode);
    expect(tree.props.children.type).toBe(BrowserRouter);
    const appElement = tree.props.children.props.children;
    expect(appElement.type.name).toBe('MockApp');
  });
});
