type CtxShape = {
  accessToken: string | null;
  setAccessToken: (t: string | null) => void;
  logout: () => void;
};

let authCtx: CtxShape | null = null;
export const setAuthCtx = ( ctx: CtxShape) => { authCtx = ctx;};
export const getAuthCtx = () => {
  if (!authCtx) throw new Error ("Auth context not set yet");
  return authCtx;
};
