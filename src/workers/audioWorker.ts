/* Stub de worker para geração assíncrona (mock). */

type GenerateRequest = {
  type: 'generate';
  requestId: string;
};

type GenerateResponse = {
  type: 'done';
  requestId: string;
  status: 'stub';
};

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { data } = event;
  if (data.type === 'generate') {
    const response: GenerateResponse = {
      type: 'done',
      requestId: data.requestId,
      status: 'stub',
    };
    // Apenas responde sem realizar trabalho pesado (mock).
    (self as unknown as Worker).postMessage(response);
  }
};
