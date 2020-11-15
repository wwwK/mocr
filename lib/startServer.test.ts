import fetch from 'node-fetch';

import { Logger } from './logger';
import { startServer } from './startServer';
import { stopServer } from './stopServer';

describe('startServer.ts', () => {
  const mockLogger = new Logger(false);

  const DEFAULT_SERVER_URL = 'http://localhost:9091';

  it('starts an http server', async () => {
    const mockServer = await startServer({
      config: {
        port: 9091,
      },
      logger: mockLogger,
    });

    const response = await fetch(DEFAULT_SERVER_URL);
    const responseBody = await response.text();

    await stopServer(mockServer, mockLogger);

    expect(responseBody).toBe('Hello World');
  });

  it('validates the body(JSON) of a POST request using the listener', async () => {
    const requestSpy = jest.fn();

    const mockServer = await startServer({
      config: {
        debug: true,
        port: 9091,
      },
      logger: mockLogger,
      requestSpy,
    });

    await fetch(DEFAULT_SERVER_URL, {
      method: 'POST',
      body: JSON.stringify({ hello: 'world' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await stopServer(mockServer, mockLogger);

    const requestBody = requestSpy.mock.calls[0][1];

    expect(requestBody).toEqual({ hello: 'world' });
  });

  it('validates a GET request using the listener', async () => {
    const requestSpy = jest.fn();

    const mockServer = await startServer({
      config: {
        debug: true,
        port: 9091,
      },
      logger: mockLogger,
      requestSpy,
    });

    await fetch(DEFAULT_SERVER_URL, { method: 'GET' });

    await stopServer(mockServer, mockLogger);

    const request = requestSpy.mock.calls[0][0];
    const requestBody = requestSpy.mock.calls[0][1];

    expect(request.method).toBe('GET');
    expect(requestBody).not.toBeDefined();
  });
});
