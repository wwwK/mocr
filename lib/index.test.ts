import fetch from 'node-fetch';

import { Logger } from './logger';
import { mocr } from '.';

describe('index.ts', () => {
  const DEFAULT_SERVER_URL = 'http://localhost:9091';

  it('starts an http server', async () => {
    const mockServer = mocr();
    await mockServer.start();

    const response = await fetch(DEFAULT_SERVER_URL);
    const body = await response.text();

    await mockServer.stop();

    expect(body).toBe('Hello World');
  });

  it('starts an http server on a different port(7091)', async () => {
    const mockServer = mocr({ port: 7091 });
    await mockServer.start();

    try {
      await fetch(DEFAULT_SERVER_URL);
    } catch (err) {
      expect(err.code).toBe('ECONNREFUSED');
    }

    const responseCasePort = await fetch('http://localhost:7091');
    expect(responseCasePort.status).toBe(200);

    await mockServer.stop();
  });

  it('starts an http server with debug option', async () => {
    jest.spyOn(Logger.prototype, 'info').mockImplementation(() => {});

    const mockServer = mocr({ debug: true });
    await mockServer.start();

    expect(Logger.prototype.info).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.info).toHaveBeenCalledWith(
      '🚀 Server running at http://localhost:9091/.'
    );

    (Logger.prototype.info as any).mockReset();
    const response = await fetch(DEFAULT_SERVER_URL);
    const body = await response.text();
    expect(Logger.prototype.info).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.info).toHaveBeenCalledWith(
      '➡️ Received request (GET)'
    );

    (Logger.prototype.info as any).mockReset();
    await mockServer.stop();
    expect(Logger.prototype.info).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.info).toHaveBeenCalledWith(
      '✋ Mock server has stopped'
    );

    expect(body).toBe('Hello World');
  });

  it('uses a spy for intercepting requests', async () => {
    const mockServer = mocr();

    jest.spyOn(mockServer.requestSpy, 'recordRequest');

    await mockServer.start();

    await fetch(`${DEFAULT_SERVER_URL}/profile`);

    const { request } = mockServer.requestSpy.calls[0];

    expect(request.url).toBe('/profile');
    expect(mockServer.requestSpy.recordRequest).toHaveBeenCalledTimes(1);

    await mockServer.stop();
  });

  it('uses a spy for intercepting requests with body(JSON)', async () => {
    const mockServer = mocr();

    jest.spyOn(mockServer.requestSpy, 'recordRequest');

    await mockServer.start();

    await fetch(`${DEFAULT_SERVER_URL}/profile`, {
      method: 'POST',
      body: 'Hello!',
    });

    const { request, body } = mockServer.requestSpy.calls[0];

    expect(request.url).toBe('/profile');
    expect(mockServer.requestSpy.recordRequest).toHaveBeenCalledTimes(1);
    expect(body).toBe('Hello!');

    await mockServer.stop();
  });

  it('mocks the next response', async () => {
    const mockServer = mocr();

    await mockServer.start();

    mockServer.mockNextResponse({
      username: 'johndoe',
    });

    const res = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resJson = await res.json();
    expect(resJson.username).toBe('johndoe');

    const resTwo = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resTwoBody = await resTwo.text();
    expect(resTwoBody).toBe('Hello World');

    await mockServer.stop();
  });

  it('mocks the next couple of responses', async () => {
    const mockServer = mocr();

    await mockServer.start();

    mockServer.mockNextResponse({
      username: 'johndoe',
    });

    mockServer.mockNextResponse({
      username: 'martymcfly',
    });

    const res = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resJson = await res.json();
    expect(resJson.username).toBe('johndoe');

    const resTwo = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resTwoJson = await resTwo.json();
    expect(resTwoJson.username).toBe('martymcfly');

    const resThree = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resThreeBody = await resThree.text();
    expect(resThreeBody).toBe('Hello World');

    await mockServer.stop();
  });

  it('mocks the next couple of responses at once', async () => {
    const mockServer = mocr();

    await mockServer.start();

    mockServer.mockNextResponses([
      {
        username: 'johndoe',
      },
      {
        username: 'martymcfly',
      },
    ]);

    const res = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resJson = await res.json();
    expect(resJson.username).toBe('johndoe');

    const resTwo = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resTwoJson = await resTwo.json();
    expect(resTwoJson.username).toBe('martymcfly');

    const resThree = await fetch(`${DEFAULT_SERVER_URL}/profile`);
    const resThreeBody = await resThree.text();
    expect(resThreeBody).toBe('Hello World');

    await mockServer.stop();
  });
});
