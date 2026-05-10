/**
 * EditModeContext — provided by `<Predicate>` while editing so peripheral
 * floating elements (e.g. ContinueInChatPill) can shift out of the way.
 * Defaults to false when no provider in scope.
 */
import React from 'react';

const Ctx = React.createContext<boolean>(false);

export function EditModeProvider({ value, children }: {
  value: boolean;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditMode(): boolean {
  return React.useContext(Ctx);
}
