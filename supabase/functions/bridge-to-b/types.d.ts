declare const Deno: {
    env: { get(k: string): string | undefined };
    serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  };