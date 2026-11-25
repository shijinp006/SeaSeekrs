import { ViewTransition } from "react";

/** A page of the website: going to another one, it steps back and the other rises (globals.css, view-transition) */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
